package com.sentio.controller;

import com.sentio.config.AppProperties;
import com.sentio.model.SentimentSnapshot;
import com.sentio.stream.SentimentStreamService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;

/**
 * Phase 6 — exposes Redis-backed sentiment data to the browser.
 *
 * ── ENDPOINTS ─────────────────────────────────────────────────────────────
 *   GET /api/sentiment/stream/{ticker}    SSE — live updates, one connection per tab
 *   GET /api/sentiment/snapshot/{ticker}  REST — current snapshot, one-shot fetch
 *   GET /api/sentiment/summary            REST — current snapshot for every tracked ticker
 *
 * ── HEARTBEAT ─────────────────────────────────────────────────────────────
 * SSE connections behind some proxies/load balancers get silently killed
 * after a period of inactivity. We merge in an SSE *comment* (not a data
 * event, so the browser's EventSource never fires onmessage for it) every
 * 15 seconds purely to keep bytes flowing on the wire.
 */
@Slf4j
@RestController
@RequestMapping("/api/sentiment")
@RequiredArgsConstructor
public class SentimentStreamController {

    private final SentimentStreamService streamService;
    private final AppProperties appProperties;

    private static final Duration HEARTBEAT_INTERVAL = Duration.ofSeconds(15);

    /**
     * Live sentiment stream for one ticker. The browser opens this once with
     * EventSource("/api/sentiment/stream/AAPL") and receives a new
     * "sentiment-update" event every time SentimentAggregator (Phase 5)
     * writes a changed snapshot to Redis.
     */
    @GetMapping(value = "/stream/{ticker}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<SentimentSnapshot>> stream(@PathVariable String ticker) {
        String upperTicker = ticker.toUpperCase();

        Flux<ServerSentEvent<SentimentSnapshot>> data = streamService.streamFor(upperTicker)
                .map(snapshot -> ServerSentEvent.<SentimentSnapshot>builder()
                        .event("sentiment-update")
                        .data(snapshot)
                        .build());

        Flux<ServerSentEvent<SentimentSnapshot>> heartbeat = Flux.interval(HEARTBEAT_INTERVAL)
                .map(tick -> ServerSentEvent.<SentimentSnapshot>builder()
                        .comment("heartbeat")
                        .build());

        return Flux.merge(data, heartbeat)
                .doOnSubscribe(s -> log.info("[SSE] Client connected: ticker={}", upperTicker))
                .doOnCancel(() -> log.info("[SSE] Client disconnected: ticker={}", upperTicker));
    }

    /**
     * One-shot current snapshot — used by the dashboard to paint an instant
     * initial state when a user switches tickers, before/alongside opening
     * the SSE connection for live updates.
     */
    @GetMapping("/snapshot/{ticker}")
    public Mono<ResponseEntity<SentimentSnapshot>> snapshot(@PathVariable String ticker) {
        return streamService.snapshot(ticker.toUpperCase())
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    /**
     * Current snapshot for every ticker in app.tickers — backs the
     * dashboard's ticker-selector row so it can show a mood indicator
     * for all 4 stocks at once without 4 separate requests.
     */
    @GetMapping("/summary")
    public Flux<SentimentSnapshot> summary() {
        return streamService.summary(appProperties.getTickers());
    }
}