package com.sentio.scraper;

import com.sentio.model.PriceTick;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import org.springframework.beans.factory.annotation.Qualifier;
import java.time.Duration;

/**
 * Stores the most recent PriceTick per ticker in Redis with a 5-minute TTL.
 *
 * ── WHY REDIS FOR PRICE DATA? ────────────────────────────────────────────
 * The dashboard needs to show the current price alongside sentiment.
 * We don't want the browser to call Yahoo Finance directly (CORS issues + rate limits).
 * Instead, YahooPricePoller writes here every 60s, and Phase 6's PriceController
 * reads from here on demand — sub-1ms reads, no external calls on the request path.
 *
 * ── KEY SCHEMA ────────────────────────────────────────────────────────────
 * Redis key format: "price:{TICKER}"
 * Examples:         "price:AAPL", "price:TSLA", "price:NVDA", "price:MSFT"
 *
 * ── TTL REASONING ────────────────────────────────────────────────────────
 * 5 minutes: if the poller stops (app crash, network issue), stale prices expire
 * automatically. The dashboard can detect missing keys and show a "data unavailable"
 * state rather than showing an hours-old price as if it were current.
 *
 * ── WHY ReactiveRedisTemplate<String, PriceTick>? ────────────────────────
 * Spring Data Redis provides two templates:
 * - RedisTemplate: blocking, runs on a dedicated thread — not suitable for WebFlux
 * - ReactiveRedisTemplate: returns Mono/Flux, fully non-blocking — correct choice here
 *
 * Spring auto-configures this bean when spring-boot-starter-data-redis-reactive
 * is on the classpath (already in pom.xml).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PriceStore {
    @Qualifier("priceTickRedisTemplate")
    // Spring auto-creates this bean — it handles Redis connection pooling + serialization
    private final ReactiveRedisTemplate<String, PriceTick> redisTemplate;

    // TTL for each price entry — stale after 5 minutes if the poller stops
    private static final Duration TTL = Duration.ofMinutes(5);

    // Key prefix — keeps price keys visually grouped in Redis (e.g. in RedisInsight)
    private static final String KEY_PREFIX = "price:";

    /**
     * Saves (or overwrites) the latest PriceTick for a ticker in Redis.
     * The key expires automatically after TTL — no manual cleanup needed.
     *
     * opsForValue() = Redis String commands (SET, GET, SETEX).
     * set(key, value, ttl) maps to Redis: SET price:AAPL <json> EX 300
     *
     * @param ticker    the stock symbol, e.g. "AAPL"
     * @param priceTick the price snapshot to store
     * @return Mono<Boolean> — true if the write succeeded
     */
    public Mono<Boolean> save(String ticker, PriceTick priceTick) {
        String key = KEY_PREFIX + ticker;
        return redisTemplate.opsForValue()
                .set(key, priceTick, TTL)
                .doOnSuccess(ok -> log.debug("[PriceStore] Saved price for {} → {}", ticker, priceTick.getRegularMarketPrice()))
                .doOnError(e -> log.error("[PriceStore] Failed to save price for {}: {}", ticker, e.getMessage()));
    }

    /**
     * Retrieves the latest PriceTick for a ticker from Redis.
     * Returns Mono.empty() if the key doesn't exist or has expired.
     *
     * Phase 6's PriceController will call this to serve prices to the browser.
     *
     * @param ticker the stock symbol, e.g. "TSLA"
     * @return Mono<PriceTick> — present if data exists, empty if expired/missing
     */
    public Mono<PriceTick> get(String ticker) {
        String key = KEY_PREFIX + ticker;
        return redisTemplate.opsForValue()
                .get(key)
                .doOnError(e -> log.error("[PriceStore] Failed to get price for {}: {}", ticker, e.getMessage()));
    }
}