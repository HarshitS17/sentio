package com.sentio.scraper;

import com.rometools.rome.feed.synd.SyndEntry;
import com.rometools.rome.feed.synd.SyndFeed;
import com.rometools.rome.io.FeedException;
import com.rometools.rome.io.SyndFeedInput;
import com.rometools.rome.io.XmlReader;
import com.sentio.config.AppProperties;
import com.sentio.config.KafkaProducerService;
import com.sentio.model.NewsArticle;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.io.IOException;
import java.net.URL;
import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Polls Yahoo Finance RSS feeds on a fixed interval and publishes each new
 * headline to the Kafka "raw-news" topic as a NewsArticle JSON message.
 *
 * ── HOW IT WORKS ──────────────────────────────────────────────────────────
 * 1. On startup (@PostConstruct), we start a Flux.interval timer.
 * 2. Every tick, we iterate over all configured RSS feed URLs.
 * 3. For each URL, we call Rome's SyndFeedInput to parse the XML.
 * 4. We map each RSS entry → NewsArticle and publish it to Kafka.
 * 5. Duplicate headlines are suppressed via a seen-URLs set (in-memory dedup).
 *
 * ── WHY BLOCKING I/O ON A SEPARATE SCHEDULER ─────────────────────────────
 * Rome's SyndFeedInput.build(new XmlReader(url)) is a blocking HTTP call.
 * In a reactive app you must NEVER block on the main reactor thread.
 * We wrap each feed fetch in Mono.fromCallable(...).subscribeOn(Schedulers.boundedElastic())
 * which moves the blocking work onto a separate thread pool designed for this.
 *
 * ── WHY CONCURRENTHASHMAP FOR DEDUP ──────────────────────────────────────
 * RSS feeds re-serve old articles on every poll. Without dedup, Kafka would
 * receive the same headline 100+ times per hour. We store seen source URLs
 * and skip any article we've already published. ConcurrentHashMap.newKeySet()
 * is thread-safe without locks — important since multiple feeds scrape in parallel.
 * Note: this resets on restart. For production, you'd persist seen URLs in Redis.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RssScraper {

    private final AppProperties appProperties;
    private final KafkaProducerService kafkaProducerService;

    // Tracks URLs of articles we've already sent to Kafka — prevents re-publishing.
    private final Set<String> seenUrls = ConcurrentHashMap.newKeySet();

    /**
     * Starts the scraping loop when the Spring context is ready.
     * Runs immediately on startup (delay = 0), then repeats every scrapeIntervalSeconds.
     */
    @PostConstruct
    public void start() {
        int intervalSeconds = appProperties.getScrapeIntervalSeconds();
        log.info("RssScraper starting — polling {} feeds every {}s",
                appProperties.getRssFeeds().size(), intervalSeconds);

        Flux.interval(Duration.ZERO, Duration.ofSeconds(intervalSeconds))
                .flatMap(tick -> scrapeAllFeeds())  // on every tick, scrape all feeds
                .subscribe(
                        result -> {},               // each article is logged inside publishArticle()
                        error -> log.error("RssScraper fatal error: {}", error.getMessage())
                );
    }

    /**
     * Iterates over all configured RSS feed URLs and scrapes each one.
     * Returns a Flux that emits one item per successfully published article.
     *
     * Flux.fromIterable turns the list of feed URLs into a reactive stream,
     * then flatMap fires all scrapes concurrently (up to default concurrency).
     */
    private Flux<Void> scrapeAllFeeds() {
        List<String> feeds = appProperties.getRssFeeds();
        List<String> tickers = appProperties.getTickers();

        return Flux.range(0, feeds.size())
                .flatMap(i -> scrapeFeed(feeds.get(i), tickers.get(i)));
    }

    /**
     * Fetches and parses a single RSS feed URL, then publishes each new article to Kafka.
     *
     * @param feedUrl the Yahoo Finance RSS URL, e.g. "https://feeds.finance.yahoo.com/..."
     * @param ticker  the stock symbol this feed belongs to, e.g. "AAPL"
     * @return Flux<Void> — one item per successfully published article
     */
    private Flux<Void> scrapeFeed(String feedUrl, String ticker) {
        // Mono.fromCallable wraps the blocking Rome call.
        // subscribeOn(boundedElastic) moves it off the reactor thread pool.
        return Mono.fromCallable(() -> parseFeed(feedUrl))
                .subscribeOn(Schedulers.boundedElastic())
                .doOnError(e -> log.warn("Failed to parse RSS feed [{}]: {}", ticker, e.getMessage()))
                .onErrorReturn(Collections.emptyList())  // if feed is down, return empty list
                .flatMapMany(Flux::fromIterable)         // List<SyndEntry> → Flux<SyndEntry>
                .filter(entry -> isNew(entry))           // skip articles we've already seen
                .map(entry -> toNewsArticle(entry))      // SyndEntry → NewsArticle
                .flatMap(article -> publishArticle(article, ticker));
    }

    /**
     * Blocking call — parses the RSS XML using Rome's SyndFeedInput.
     * Must always run on Schedulers.boundedElastic(), never on the reactor thread.
     *
     * @return list of feed entries (articles), or empty list on parse error
     */
    private List<SyndEntry> parseFeed(String feedUrl) throws IOException, FeedException {
        SyndFeedInput input = new SyndFeedInput();
        SyndFeed feed = input.build(new XmlReader(new URL(feedUrl)));
        return feed.getEntries();
    }

    /**
     * Returns true if this article's URL hasn't been seen before.
     * Also registers it as seen so future calls return false.
     *
     * ConcurrentHashMap.add() returns true only on first insert — this is
     * the standard pattern for atomic "check then insert" without a lock.
     */
    private boolean isNew(SyndEntry entry) {
        String url = entry.getLink();
        if (url == null || url.isBlank()) return false;
        return seenUrls.add(url);   // returns true if newly added
    }

    /**
     * Converts a Rome SyndEntry into our domain model NewsArticle.
     * Handles null fields defensively — RSS feeds are inconsistent.
     */
    private NewsArticle toNewsArticle(SyndEntry entry) {
        // publishedDate can be null for malformed RSS entries — fall back to now
        Instant publishedAt = (entry.getPublishedDate() != null)
                ? entry.getPublishedDate().toInstant()
                : Instant.now();

        // Some feeds put the summary in description, others leave it null
        String description = (entry.getDescription() != null)
                ? entry.getDescription().getValue()
                : "";

        return NewsArticle.builder()
                .title(entry.getTitle())
                .description(description)
                .publishedAt(publishedAt)
                .sourceUrl(entry.getLink())
                .build();
    }

    /**
     * Sends a NewsArticle to the Kafka "raw-news" topic.
     * The ticker is used as the Kafka message key — this ensures all articles
     * for the same stock go to the same Kafka partition (ordering guarantee).
     */
    private Mono<Void> publishArticle(NewsArticle article, String ticker) {
        log.info("[RssScraper] Publishing: ticker={} title=\"{}\"", ticker, article.getTitle());
        return kafkaProducerService.send("raw-news", ticker, article);
    }
}