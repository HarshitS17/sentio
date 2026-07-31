package com.sentio.processor;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sentio.model.SentimentLabel;
import com.sentio.model.SentimentResult;
import com.sentio.model.SentimentSnapshot;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.kafka.autoconfigure.KafkaProperties;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import reactor.kafka.receiver.KafkaReceiver;
import reactor.kafka.receiver.ReceiverOptions;
import reactor.kafka.receiver.ReceiverRecord;

import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Consumes scored SentimentResults from "sentiment-out", maintains a rolling
 * window of the last 50 results per ticker in Redis, and writes a pre-computed
 * SentimentSnapshot that Phase 6's SSE endpoint will push to the browser.*
 * ── PIPELINE POSITION ────────────────────────────────────────────────────
 *
 *   Kafka "sentiment-out"
 *         ↓  (this class consumes here)
 *   Redis LIST   "results:{ticker}"    rolling window of last 50 SentimentResults
 *         ↓
 *   Redis STRING "snapshot:{ticker}"   pre-computed SentimentSnapshot
 *         ↓
 *   Phase 6 SSE endpoint → browser dashboard
 *
 * ── WHY A SEPARATE KAFKARECEIVER? ────────────────────────────────────────
 * KafkaConsumerConfig already creates a KafkaReceiver on "raw-news" with
 * consumer group "sentio-group". We need a second receiver on "sentiment-out"
 * with a DIFFERENT group id ("sentio-aggregator") so Kafka tracks their
 * offsets independently. We build it inline here rather than adding another
 * bean to KafkaConsumerConfig to keep this class self-contained.
 *
 * ── REDIS DATA STRUCTURES ────────────────────────────────────────────────
 *
 * Redis LIST   → key "results:{ticker}"
 *   Circular buffer of the last MAX_RESULTS serialized SentimentResult JSONs.
 *   LPUSH puts newest at index 0. LTRIM drops overflow from the tail.
 *
 * Redis STRING → key "snapshot:{ticker}"
 *   Pre-computed SentimentSnapshot JSON. Overwritten on every new result.
 *   TTL = 10 minutes. Phase 6 reads this on each SSE tick — O(1) read.
 *
 * ── WHY PRE-COMPUTE THE SNAPSHOT? ────────────────────────────────────────
 * SSE endpoint (Phase 6) ticks every second per connected browser tab.
 * Computing rolling averages on every SSE read = Redis LIST read + math on
 * every request. Instead we compute once here per NEW result (much rarer)
 * and serve the cached snapshot on every SSE tick. Classic write-time
 * precomputation pattern — trades write cost for read throughput.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SentimentAggregator {

    private final ObjectMapper objectMapper;

    // String/String template — declared @Primary in RedisConfig.
    // We store everything as serialized JSON strings so one template handles all types.
    private final ReactiveRedisTemplate<String, String> redisTemplate;

    // Injected so we can call buildConsumerProperties() — same pattern as KafkaConsumerConfig
    private final KafkaProperties kafkaProperties;

    private static final int MAX_RESULTS = 50;
    private static final int RECENT_HEADLINES_COUNT = 5;
    private static final Duration SNAPSHOT_TTL = Duration.ofMinutes(10);
    private static final String RESULTS_PREFIX = "results:";
    private static final String SNAPSHOT_PREFIX = "snapshot:";

    /**
     * Builds a dedicated KafkaReceiver subscribed to "sentiment-out".
     *
     * Key difference from KafkaConsumerConfig:
     * - topic: "sentiment-out" (not "raw-news")
     * - group.id: "sentio-aggregator" (not "sentio-group")
     *
     * Same consumer group = Kafka splits partitions between consumers (load balancing).
     * Different consumer group = both consumers get ALL messages (fan-out).
     * We want fan-out here — every scored result should reach the aggregator.
     */
    private KafkaReceiver<String, String> buildReceiver() {
        // Start from application.yaml kafka consumer config (bootstrap-servers, deserializers)
        Map<String, Object> props = kafkaProperties.buildConsumerProperties();

        // Override group.id — MUST differ from "sentio-group" used by the processor
        props.put("group.id", "sentio-aggregator");

        ReceiverOptions<String, String> options = ReceiverOptions
                .<String, String>create(props)
                .subscription(Collections.singletonList("sentiment-out"));

        return KafkaReceiver.create(options);
    }

    @PostConstruct
    public void start() {
        log.info("SentimentAggregator starting — listening on sentiment-out topic");

        buildReceiver()
                .receive()
                .flatMap(this::processRecord)
                .subscribe(
                        result -> {},
                        error -> log.error("SentimentAggregator fatal error: {}", error.getMessage())
                );
    }

    /**
     * Processes one Kafka record:
     * 1. Deserialize JSON → SentimentResult
     * 2. Push to Redis rolling window (LPUSH + LTRIM)
     * 3. Read back window (LRANGE)
     * 4. Compute rolling average + build SentimentSnapshot
     * 5. Save snapshot to Redis with TTL
     * 6. Acknowledge Kafka offset
     */
    private Mono<Void> processRecord(ReceiverRecord<String, String> record) {
        String ticker = record.key();

        return Mono.fromCallable(() -> objectMapper.readValue(record.value(), SentimentResult.class))
                .subscribeOn(Schedulers.boundedElastic())
                .flatMap(result -> pushToWindow(ticker, result))
                .flatMap(window -> buildAndSaveSnapshot(ticker, window))
                .doOnSuccess(v -> {
                    record.receiverOffset().acknowledge();
                    log.debug("[Aggregator] Snapshot updated: ticker={}", ticker);
                })
                .doOnError(e -> {
                    log.error("[Aggregator] Failed: ticker={} error={}", ticker, e.getMessage());
                    // Acknowledge even on error — otherwise this record blocks the
                    // entire partition and no subsequent messages get processed
                    record.receiverOffset().acknowledge();
                })
                .onErrorResume(e -> Mono.empty());
    }

    /**
     * Pushes a SentimentResult into the Redis LIST for this ticker and
     * returns the current full window as a List<SentimentResult>.
     *
     * Redis operations (in order):
     *   LPUSH results:AAPL <json>     → push new item to front (index 0 = newest)
     *   LTRIM results:AAPL 0 49       → keep only 50 items, drop the 51st onwards
     *   LRANGE results:AAPL 0 49      → read back all 50 items
     *
     * Why not just keep a Java List in memory?
     * In-memory state is lost on restart. Redis persists it so the rolling
     * window survives app restarts and the dashboard shows historical context
     * immediately rather than starting from zero every time.
     */
    private Mono<List<SentimentResult>> pushToWindow(String ticker, SentimentResult result) {
        String listKey = RESULTS_PREFIX + ticker;

        return Mono.fromCallable(() -> objectMapper.writeValueAsString(result))
                .subscribeOn(Schedulers.boundedElastic())
                .flatMap(json -> redisTemplate.opsForList().leftPush(listKey, json))
                .flatMap(size -> redisTemplate.opsForList().trim(listKey, 0, MAX_RESULTS - 1))
                .flatMap(ok -> redisTemplate.opsForList().range(listKey, 0, MAX_RESULTS - 1).collectList())
                .flatMap(this::deserializeWindow);
    }

    /**
     * Deserializes a List<String> (raw JSON from Redis) into List<SentimentResult>.
     * Skips malformed entries silently — one bad record in Redis
     * shouldn't break the entire window computation.
     */
    private Mono<List<SentimentResult>> deserializeWindow(List<String> jsonList) {
        return Mono.fromCallable(() ->
                jsonList.stream()
                        .map(json -> {
                            try {
                                return objectMapper.readValue(json, SentimentResult.class);
                            } catch (Exception e) {
                                log.warn("[Aggregator] Skipping malformed window entry: {}", e.getMessage());
                                return null;
                            }
                        })
                        .filter(r -> r != null)
                        .collect(Collectors.toList())
        ).subscribeOn(Schedulers.boundedElastic());
    }

    /**
     * Computes and saves a SentimentSnapshot from the current rolling window.
     *
     * rollingAverage  = mean compound score across all window items
     * trend           = SentimentLabel of that average (POSITIVE/NEGATIVE/NEUTRAL)
     * sampleCount     = total items in window (grows from 0 to MAX_RESULTS)
     * recentHeadlines = first 5 items (LPUSH means index 0 = most recent)
     * generatedAt     = current timestamp
     *
     * Saved under "snapshot:{ticker}" with SNAPSHOT_TTL.
     * If the pipeline stops, TTL ensures stale data eventually expires so the
     * dashboard can show a "data unavailable" state rather than stale scores.
     */
    private Mono<Void> buildAndSaveSnapshot(String ticker, List<SentimentResult> window) {
        if (window.isEmpty()) return Mono.empty();

        double avg = window.stream()
                .mapToDouble(SentimentResult::getCompound)
                .average()
                .orElse(0.0);

        List<SentimentResult> recentHeadlines = window.stream()
                .limit(RECENT_HEADLINES_COUNT)
                .collect(Collectors.toList());

        SentimentSnapshot snapshot = SentimentSnapshot.builder()
                .ticker(ticker)
                .rollingAverage(avg)
                .trend(classifyAverage(avg))
                .sampleCount(window.size())
                .recentHeadlines(recentHeadlines)
                .generatedAt(Instant.now())
                .build();

        log.info("[Aggregator] ticker={} avg={} trend={} samples={}",
                ticker,
                String.format("%.4f", avg),
                snapshot.getTrend(),
                snapshot.getSampleCount());

        return Mono.fromCallable(() -> objectMapper.writeValueAsString(snapshot))
                .subscribeOn(Schedulers.boundedElastic())
                .flatMap(json ->
                        redisTemplate.opsForValue()
                                .set(SNAPSHOT_PREFIX + ticker, json, SNAPSHOT_TTL)
                )
                .then();
    }

    /**
     * Classifies a rolling average into a SentimentLabel.
     * Uses same ±0.05 thresholds as SentimentProcessorService for consistency —
     * the dashboard uses this label as the color indicator (green/red/grey).
     */
    private SentimentLabel classifyAverage(double avg) {
        if (avg >= 0.05) return SentimentLabel.POSITIVE;
        if (avg <= -0.05) return SentimentLabel.NEGATIVE;
        return SentimentLabel.NEUTRAL;
    }
}