package com.sentio.processor;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vader.sentiment.analyzer.SentimentAnalyzer;
import com.vader.sentiment.analyzer.SentimentPolarities;
import com.sentio.config.KafkaProducerService;
import com.sentio.model.NewsArticle;
import com.sentio.model.SentimentLabel;
import com.sentio.model.SentimentResult;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.kafka.receiver.KafkaReceiver;
import reactor.kafka.receiver.ReceiverRecord;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.time.Instant;

/**
 * Consumes raw headlines from Kafka, scores them with VADER, and publishes
 * the result to the "sentiment-out" topic for the aggregator to pick up.
 *
 * ── PIPELINE POSITION ────────────────────────────────────────────────────
 *
 *   Kafka "raw-news"
 *         ↓  (this class consumes here)
 *   VADER scoring  (~2ms per headline, runs on boundedElastic)
 *         ↓
 *   Kafka "sentiment-out"
 *         ↓  (SentimentAggregator consumes here)
 *
 * ── WHAT IS VADER? ───────────────────────────────────────────────────────
 * VADER (Valence Aware Dictionary and sEntiment Reasoner) is a rule-based
 * sentiment analysis tool built specifically for social media and financial text.
 * It works WITHOUT a machine learning model — it uses a hand-crafted lexicon
 * (word → sentiment score dictionary) plus rules for punctuation, capitalization,
 * and word modifiers like "very", "not", "!!!" etc.
 *
 * Key output: the COMPOUND score (-1.0 to +1.0):
 *   >= +0.05  → POSITIVE  ("Apple smashes earnings expectations!")
 *   <= -0.05  → NEGATIVE  ("Tesla recalls 200,000 vehicles amid safety concerns")
 *   between   → NEUTRAL   ("Apple reports quarterly results")
 *
 * Why VADER over a neural model?
 * - Zero inference latency (~2ms vs 200ms+ for a transformer)
 * - No GPU needed, runs on the JVM
 * - No API cost
 * - Surprisingly accurate on short financial headlines
 *
 * ── WHY subscribeOn(boundedElastic)? ────────────────────────────────────
 * SentimentAnalyzer.getScoresFor() is a pure CPU computation — it's not I/O,
 * but it's still blocking (synchronous). In a reactive app, blocking work must
 * NOT run on the reactor event loop (reactor-http-nio threads). If it did,
 * it would stall the whole server from handling other requests.
 *
 * Schedulers.boundedElastic() is Spring's designated thread pool for blocking
 * or CPU-heavy work. It's bounded (won't spawn infinite threads under load).
 *
 * ── WHY ACKNOWLEDGE MANUALLY? ────────────────────────────────────────────
 * Reactor Kafka gives us ReceiverRecord which has a .receiverOffset() handle.
 * Calling .acknowledge() tells Kafka: "I've processed this message, advance
 * the consumer offset." Without this, if the app restarts, Kafka would
 * re-deliver all unacknowledged messages — exactly what we want for reliability.
 * We only acknowledge AFTER the downstream publish succeeds.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SentimentProcessorService {

    // KafkaReceiver is the reactive Kafka consumer — configured in KafkaConsumerConfig
    // It gives us a Flux<ReceiverRecord> — one item per Kafka message
    private final KafkaReceiver<String, String> kafkaReceiver;

    private final KafkaProducerService kafkaProducerService;

    // Jackson ObjectMapper for deserializing the Kafka message JSON → NewsArticle
    private final ObjectMapper objectMapper;

    // VADER thresholds — these are the standard values from the original paper
    private static final float POSITIVE_THRESHOLD = 0.05f;
    private static final float NEGATIVE_THRESHOLD = -0.05f;

    /**
     * Starts consuming from Kafka on startup.
     *
     * kafkaReceiver.receive() returns a Flux<ReceiverRecord<String, String>>.
     * Each ReceiverRecord wraps one Kafka message with:
     *   - .key()   → the ticker symbol (e.g. "AAPL")
     *   - .value() → the JSON payload (serialized NewsArticle)
     *   - .receiverOffset() → handle to acknowledge the message
     *
     * flatMap(this::processRecord) processes each record reactively.
     * concatMap would process them sequentially — flatMap allows parallelism,
     * which is fine here since records are independent of each other.
     */
    @PostConstruct
    public void start() {
        log.info("SentimentProcessorService starting — listening on raw-news topic");

        kafkaReceiver.receive()
                .flatMap(this::processRecord)
                .subscribe(
                        result -> {},
                        error -> log.error("SentimentProcessorService fatal error: {}", error.getMessage())
                );
    }

    /**
     * Full processing pipeline for one Kafka message:
     * 1. Deserialize JSON → NewsArticle
     * 2. Run VADER on the headline (on boundedElastic thread)
     * 3. Build SentimentResult
     * 4. Publish to "sentiment-out" topic
     * 5. Acknowledge the Kafka offset (mark as processed)
     *
     * If deserialization fails (malformed JSON), we log and acknowledge anyway
     * so the bad message doesn't block the consumer forever.
     */
    private Mono<Void> processRecord(ReceiverRecord<String, String> record) {
        String ticker = record.key();
        String json = record.value();

        return Mono.fromCallable(() -> objectMapper.readValue(json, NewsArticle.class))
                // deserializeOn boundedElastic — ObjectMapper.readValue is synchronous
                .subscribeOn(Schedulers.boundedElastic())
                .flatMap(article -> scoreArticle(article, ticker))
                .flatMap(result -> publishResult(result))
                // After publish succeeds → acknowledge the Kafka offset
                // This tells Kafka: "offset consumed, don't redeliver"
                .doOnSuccess(v -> record.receiverOffset().acknowledge())
                .doOnError(e -> {
                    log.error("[Processor] Failed to process record ticker={}: {}", ticker, e.getMessage());
                    // Still acknowledge on error — otherwise this bad message
                    // blocks all subsequent messages in the partition forever
                    record.receiverOffset().acknowledge();
                })
                .onErrorResume(e -> Mono.empty());
    }

    /**
     * Runs VADER sentiment analysis on the article headline.
     *
     * We score the TITLE (not description) because:
     * - Titles are concise and sentiment-dense
     * - Descriptions are often truncated or missing in RSS feeds
     * - VADER is most accurate on short, punchy text
     *
     * Mono.fromCallable wraps the synchronous VADER call so we can
     * subscribeOn(boundedElastic) and keep the reactor thread free.
     */
    private Mono<SentimentResult> scoreArticle(NewsArticle article, String ticker) {
        return Mono.fromCallable(() -> {
            String headline = article.getTitle();

            // This is the single VADER API call — takes ~2ms
            SentimentPolarities scores = SentimentAnalyzer.getScoresFor(headline);
            float compound = scores.getCompoundPolarity();

            SentimentResult result = SentimentResult.builder()
                    .ticker(ticker)
                    .headline(headline)
                    .compound(compound)
                    .label(classifyCompound(compound))
                    .timestamp(Instant.now())
                    .build();

            log.info("[Processor] Scored: ticker={} compound={} label={} headline=\"{}\"",
                    ticker,
                    String.format("%.4f", compound),
                    result.getLabel(),
                    headline.length() > 60 ? headline.substring(0, 60) + "..." : headline);

            return result;
        }).subscribeOn(Schedulers.boundedElastic());
    }

    /**
     * Converts a raw VADER compound score into a human-readable SentimentLabel.
     *
     * These thresholds come directly from the original VADER paper (Hutto & Gilbert 2014).
     * They're deliberately asymmetric: most financial headlines are slightly positive
     * by default (market reporting bias), so the neutral band ±0.05 prevents noise.
     *
     * Examples:
     *   "Apple smashes earnings, stock soars 8%"  → compound ≈ +0.72 → POSITIVE
     *   "Tesla recalls 50,000 vehicles"            → compound ≈ -0.34 → NEGATIVE
     *   "Apple reports quarterly results"           → compound ≈ +0.00 → NEUTRAL
     */
    private SentimentLabel classifyCompound(float compound) {
        if (compound >= POSITIVE_THRESHOLD) return SentimentLabel.POSITIVE;
        if (compound <= NEGATIVE_THRESHOLD) return SentimentLabel.NEGATIVE;
        return SentimentLabel.NEUTRAL;
    }

    /**
     * Publishes the scored SentimentResult to the "sentiment-out" Kafka topic.
     * The ticker is used as the message key — guarantees all results for one
     * stock land in the same Kafka partition (ordering preserved per ticker).
     */
    private Mono<Void> publishResult(SentimentResult result) {
        return kafkaProducerService.send("sentiment-out", result.getTicker(), result);
    }
}