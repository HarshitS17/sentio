package com.sentio.stream;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sentio.model.SentimentSnapshot;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.time.Duration;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

/**
 * Turns Redis snapshot data into live Flux streams the SSE controller can subscribe to.
 *
 * ── PIPELINE POSITION ────────────────────────────────────────────────────
 *
 *   Redis STRING "snapshot:{ticker}"   (written by Phase 5's SentimentAggregator)
 *         ↓  (this class polls here)
 *   Flux<SentimentSnapshot>            one shared stream per ticker
 *         ↓
 *   SentimentStreamController          wraps each in a ServerSentEvent
 *         ↓
 *   Browser EventSource                Phase 7 dashboard
 *
 * ── WHY POLL REDIS INSTEAD OF PUSHING FROM THE AGGREGATOR DIRECTLY? ──────
 * SentimentAggregator (Phase 5) already writes every new snapshot to Redis.
 * Polling here keeps this class fully decoupled from Phase 5 — it doesn't
 * need a direct reference to the aggregator, a Sinks.Many, or any shared
 * in-process pub/sub. It also means restarting just the web layer (or
 * running it as a separate instance later) doesn't lose any events, since
 * Redis is the source of truth, not an in-memory bus.
 *
 * ── WHY "SHARED MULTICASTED" INSTEAD OF ONE POLL PER SUBSCRIBER? ─────────
 * If 10 browser tabs all watch AAPL, we do NOT want 10 independent
 * Flux.interval().flatMap(redis.get(...)) chains hammering Redis every
 * second. Flux#share() (= publish().refCount(1)) makes every ticker's
 * stream hot and multicasted: the first subscriber starts the polling,
 * every subsequent subscriber for the same ticker piggybacks on the same
 * Redis reads, and the poll stops automatically once the last tab
 * disconnects. One ConcurrentHashMap entry per ticker holds that shared
 * Flux so repeated calls to streamFor("AAPL") return the same hot stream.
 *
 * ── WHY dedup WITH distinctUntilChanged? ─────────────────────────────────
 * We poll every second regardless of whether the aggregator has actually
 * written a new snapshot in that window. Deduping on generatedAt means the
 * browser only receives an SSE event when the data actually changed —
 * no redundant re-renders of an identical chart point.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SentimentStreamService {

    private final ReactiveRedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;

    private static final Duration POLL_INTERVAL = Duration.ofSeconds(1);
    private static final String SNAPSHOT_PREFIX = "snapshot:";

    // One shared hot Flux per ticker. computeIfAbsent ensures we only ever
    // build the underlying Flux.interval(...) chain once per ticker, no
    // matter how many callers ask for it concurrently.
    private final Map<String, Flux<SentimentSnapshot>> sharedStreams = new ConcurrentHashMap<>();

    /**
     * Returns a hot, shared, deduped stream of snapshots for one ticker.
     * Safe to call repeatedly — the underlying Redis polling is created
     * once and reused across every subscriber.
     *
     * @param ticker the stock symbol, e.g. "AAPL"
     * @return Flux<SentimentSnapshot> — emits only when the snapshot changes
     */
    public Flux<SentimentSnapshot> streamFor(String ticker) {
        return sharedStreams.computeIfAbsent(ticker, this::buildSharedStream);
    }

    private Flux<SentimentSnapshot> buildSharedStream(String ticker) {
        return Flux.interval(POLL_INTERVAL)
                .flatMap(tick -> fetchSnapshot(ticker))
                .distinctUntilChanged(SentimentSnapshot::getGeneratedAt)
                .doOnSubscribe(s -> log.info("[Stream] Subscriber attached: ticker={}", ticker))
                .doOnCancel(() -> log.info("[Stream] Subscriber detached: ticker={}", ticker))
                .share();
    }

    /**
     * One-off fetch of the current snapshot — used for the initial page
     * load before the SSE connection delivers the first live update, and
     * for the plain REST /snapshot/{ticker} endpoint.
     *
     * @param ticker the stock symbol, e.g. "TSLA"
     * @return Mono<SentimentSnapshot> — empty if no snapshot exists yet (TTL expired or pipeline hasn't produced one)
     */
    public Mono<SentimentSnapshot> snapshot(String ticker) {
        return fetchSnapshot(ticker);
    }

    /**
     * Fetches the current snapshot for every tracked ticker in one call —
     * backs the /summary endpoint used to populate the dashboard's ticker list.
     *
     * @param tickers the full list of tracked symbols, e.g. from AppProperties
     * @return Flux<SentimentSnapshot> — one item per ticker that currently has data
     */
    public Flux<SentimentSnapshot> summary(List<String> tickers) {
        return Flux.fromIterable(tickers)
                .flatMap(this::fetchSnapshot);
    }

    private Mono<SentimentSnapshot> fetchSnapshot(String ticker) {
        return redisTemplate.opsForValue()
                .get(SNAPSHOT_PREFIX + ticker)
                .flatMap(json -> Mono.fromCallable(() -> objectMapper.readValue(json, SentimentSnapshot.class))
                        .subscribeOn(Schedulers.boundedElastic()))
                .onErrorResume(e -> {
                    log.warn("[Stream] Failed to read/parse snapshot for {}: {}", ticker, e.getMessage());
                    return Mono.empty();
                });
    }
}