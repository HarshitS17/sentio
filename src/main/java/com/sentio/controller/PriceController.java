package com.sentio.controller;

import com.sentio.model.PriceTick;
import com.sentio.model.SentimentSnapshot;
import com.sentio.model.TickerFullSnapshot;
import com.sentio.scraper.PriceStore;
import com.sentio.stream.SentimentStreamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

/**
 * Phase 6 — exposes Redis-backed price data (written by Phase 4's
 * YahooPricePoller via PriceStore) to the browser.
 *
 * ── ENDPOINTS ─────────────────────────────────────────────────────────────
 *   GET /api/price/{ticker}       REST — latest price only
 *   GET /api/price/full/{ticker}  REST — latest price + latest sentiment snapshot together
 *
 * Price doesn't need an SSE stream of its own: it only changes once every
 * 60s (the poller's interval), so the dashboard just re-fetches it on a
 * plain interval/timer client-side rather than holding a second
 * server-pushed connection open per tab.
 */
@RestController
@RequestMapping("/api/price")
@RequiredArgsConstructor
public class PriceController {

    private final PriceStore priceStore;
    private final SentimentStreamService streamService;

    /**
     * Latest price for one ticker. 404 if YahooPricePoller hasn't polled it
     * yet, or its 5-minute TTL has expired.
     */
    @GetMapping("/{ticker}")
    public Mono<ResponseEntity<PriceTick>> price(@PathVariable String ticker) {
        return priceStore.get(ticker.toUpperCase())
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    /**
     * Combined price + sentiment for one ticker in a single round trip —
     * the dashboard calls this once per ticker switch to paint price and
     * mood together immediately, instead of firing two separate requests.
     *
     * Either field can be null (see TickerFullSnapshot) if that piece of
     * data hasn't been produced yet or has expired — the dashboard should
     * handle a null price or null sentiment gracefully rather than treating
     * either as an error.
     */
    @GetMapping("/full/{ticker}")
    public Mono<TickerFullSnapshot> full(@PathVariable String ticker) {
        String upperTicker = ticker.toUpperCase();

        // Mono.zip short-circuits to empty if EITHER source is empty, but we
        // want to return whichever piece of data IS available even if the
        // other is missing/expired. Substitute an empty sentinel object
        // (ticker field left null by the builder) so zip always fires, then
        // convert the sentinel back to a real null in the result.
        Mono<PriceTick> priceMono = priceStore.get(upperTicker)
                .defaultIfEmpty(PriceTick.builder().build());
        Mono<SentimentSnapshot> sentimentMono = streamService.snapshot(upperTicker)
                .defaultIfEmpty(SentimentSnapshot.builder().build());

        return Mono.zip(priceMono, sentimentMono, (price, sentiment) ->
                TickerFullSnapshot.builder()
                        .ticker(upperTicker)
                        .price(price.getTicker() == null ? null : price)
                        .sentiment(sentiment.getTicker() == null ? null : sentiment)
                        .build()
        );
    }
}