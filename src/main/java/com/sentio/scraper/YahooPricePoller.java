package com.sentio.scraper;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sentio.config.AppProperties;
import com.sentio.config.KafkaProducerService;
import com.sentio.model.PriceTick;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.Instant;

/**
 * Polls Yahoo Finance's unofficial chart API on a fixed interval and publishes
 * each stock's price snapshot to the Kafka "price-tick" topic as a PriceTick.
 *
 * ── WHICH API ARE WE CALLING? ─────────────────────────────────────────────
 * Yahoo Finance's public (unofficial) chart endpoint:
 *   https://query1.finance.yahoo.com/v8/finance/chart/{TICKER}
 *
 * It returns JSON with a "meta" block that contains all the price fields we need.
 * No API key required. Note: this endpoint is rate-limited — don't poll too fast.
 * 60s intervals (our default) is safe for 4 tickers.
 *
 * ── WHY WEBCLIENT, NOT RESTTEMPLATE? ──────────────────────────────────────
 * WebClient is the reactive HTTP client in Spring WebFlux. It's non-blocking —
 * the thread is free while waiting for the HTTP response. RestTemplate is
 * deprecated in WebFlux apps because it blocks the thread for the full round-trip.
 *
 * ── WHY @Autowired ON THE CONSTRUCTOR? ────────────────────────────────────
 * Spring can inject WebClient.Builder automatically because Spring Boot
 * auto-configures it as a prototype-scoped bean (a fresh builder per injection).
 * We use @Autowired explicitly (instead of @RequiredArgsConstructor) because
 * Lombok's generated constructor doesn't include WebClient.Builder — Spring
 * needs the explicit hint to resolve it correctly.
 *
 * ── JSON PARSING STRATEGY ─────────────────────────────────────────────────
 * We use Jackson's JsonNode to navigate the response tree dynamically.
 * This avoids coupling to Yahoo's exact schema —
 * if they add/remove fields, our code won't break.
 *
 * The response looks like:
 * {
 *   "chart": {
 *     "result": [{
 *       "meta": {
 *         "regularMarketPrice": 178.52,
 *         "regularMarketChange": 3.21,
 *         "regularMarketChangePercent": 1.83,
 *         "regularMarketVolume": 52340000
 *       }
 *     }]
 *   }
 * }
 */
@Slf4j
@Service
public class YahooPricePoller {

    private final AppProperties appProperties;
    private final KafkaProducerService kafkaProducerService;
    private final PriceStore priceStore;
    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    // Base URL for Yahoo Finance chart API — no API key needed
    private static final String YAHOO_BASE_URL = "https://query1.finance.yahoo.com";

    /**
     * @Autowired is required here (not just @Service + constructor) because
     * WebClient.Builder is a prototype bean — Spring needs an explicit signal
     * to inject it into a non-@RequiredArgsConstructor constructor.
     */
    @Autowired
    public YahooPricePoller(AppProperties appProperties,
                            KafkaProducerService kafkaProducerService,
                            PriceStore priceStore,
                            WebClient.Builder webClientBuilder,
                            ObjectMapper objectMapper) {
        this.appProperties = appProperties;
        this.kafkaProducerService = kafkaProducerService;
        this.priceStore = priceStore;
        this.objectMapper = objectMapper;
        // Build a WebClient instance with Yahoo's base URL baked in
        this.webClient = webClientBuilder.baseUrl(YAHOO_BASE_URL).build();
    }

    /**
     * Starts the price polling loop on startup.
     * Polls immediately (delay = 0), then repeats every pricePollIntervalSeconds.
     */
    @PostConstruct
    public void start() {
        int intervalSeconds = appProperties.getPricePollIntervalSeconds();
        log.info("YahooPricePoller starting — polling {} tickers every {}s",
                appProperties.getTickers().size(), intervalSeconds);

        Flux.interval(Duration.ZERO, Duration.ofSeconds(intervalSeconds))
                .flatMap(tick -> pollAllTickers())
                .subscribe(
                        result -> {},
                        error -> log.error("YahooPricePoller fatal error: {}", error.getMessage())
                );
    }

    /**
     * Polls all configured tickers in parallel on each timer tick.
     * Flux.fromIterable turns the ticker list into a stream,
     * then flatMap fires all HTTP calls concurrently.
     */
    private Flux<Void> pollAllTickers() {
        return Flux.fromIterable(appProperties.getTickers())
                .flatMap(this::pollTicker);
    }

    /**
     * Fetches the current price for one ticker from Yahoo Finance,
     * maps it to a PriceTick, and publishes to Kafka + Redis.
     *
     * .bodyToMono(JsonNode.class)
     *   → WebClient deserializes the response JSON into a Jackson JsonNode tree
     *
     * .onErrorResume(...)
     *   → if Yahoo returns 429 / network error / market closed, log and skip
     *     so the rest of the tickers still get polled
     */
    private Mono<Void> pollTicker(String ticker) {
        return webClient.get()
                .uri("/v8/finance/chart/{ticker}", ticker)
                .header("User-Agent", "Mozilla/5.0")   // Yahoo rejects requests without a User-Agent
                .retrieve()
                .bodyToMono(String.class)
                .flatMap(jsonStr -> {
                    try {
                        JsonNode json = objectMapper.readTree(jsonStr);
                        return buildPriceTick(json, ticker);
                    } catch (Exception e) {
                        return Mono.error(e);
                    }
                })
                .flatMap(priceTick -> publishPriceTick(priceTick, ticker))
                .onErrorResume(e -> {
                    log.warn("[YahooPricePoller] Failed to fetch price for {}: {}", ticker, e.getMessage());
                    return Mono.empty();
                });
    }

    /**
     * Navigates the Yahoo Finance JSON response tree and extracts price fields.
     *
     * Uses JsonNode.path() instead of .get() because path() returns a MissingNode
     * (never null) when a key is absent — much safer for deeply nested JSON.
     *
     * Returns Mono.empty() if the response structure is unexpected.
     */
    private Mono<PriceTick> buildPriceTick(JsonNode root, String ticker) {
        try {
            // Navigate: root → chart → result[0] → meta
            JsonNode meta = root
                    .path("chart")
                    .path("result")
                    .path(0)
                    .path("meta");

            if (meta.isMissingNode() || meta.isNull()) {
                log.warn("[YahooPricePoller] Unexpected JSON structure for ticker={}", ticker);
                return Mono.empty();
            }

            PriceTick priceTick = PriceTick.builder()
                    .ticker(ticker)
                    .regularMarketPrice(meta.path("regularMarketPrice").asDouble(0.0))
                    .regularMarketChange(meta.path("regularMarketChange").asDouble(0.0))
                    .regularMarketChangePercent(meta.path("regularMarketChangePercent").asDouble(0.0))
                    .regularMarketVolume(meta.path("regularMarketVolume").asLong(0L))
                    .fetchedAt(Instant.now())
                    .build();

            log.info("[YahooPricePoller] Fetched: ticker={} price={} change={}%",
                    ticker,
                    priceTick.getRegularMarketPrice(),
                    String.format("%.2f", priceTick.getRegularMarketChangePercent()));

            return Mono.just(priceTick);

        } catch (Exception e) {
            log.warn("[YahooPricePoller] Failed to parse response for ticker={}: {}", ticker, e.getMessage());
            return Mono.empty();
        }
    }

    /**
     * Publishes the PriceTick to Kafka AND saves it to Redis.
     * .then() chains the two: Kafka write completes first, then Redis write fires.
     * If Kafka fails, Redis is skipped (fail-fast is intentional here).
     */
    private Mono<Void> publishPriceTick(PriceTick priceTick, String ticker) {
        return kafkaProducerService.send("price-tick", ticker, priceTick)
                .then(priceStore.save(ticker, priceTick).then());
    }
}