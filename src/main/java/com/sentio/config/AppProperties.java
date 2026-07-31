package com.sentio.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Binds everything under "app:" in application.yaml into a single typed object.
 *
 * Why do this instead of @Value("${app.tickers}")?
 * - @Value works for a single string, but breaks on lists and is harder to test.
 * - @ConfigurationProperties gives you a real Java object you can inject anywhere,
 *   and Spring validates it at startup — if a field is missing, the app won't start.
 *
 * Usage: inject AppProperties wherever you need tickers, feed URLs, or intervals.
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    /**
     * List of ticker symbols to track, e.g. ["AAPL", "TSLA", "NVDA", "MSFT"].
     * Comes from app.tickers in application.yaml.
     */
    private List<String> tickers;

    /**
     * Yahoo Finance RSS feed URLs, one per ticker.
     * Order must match tickers — index 0 = AAPL feed, index 1 = TSLA feed, etc.
     * Comes from app.rss-feeds in application.yaml.
     */
    private List<String> rssFeeds;

    /**
     * How often the RSS scraper should poll, in seconds. Default: 30.
     * Comes from app.scrape-interval-seconds in application.yaml.
     */
    private int scrapeIntervalSeconds = 30;

    /**
     * How often the price poller should fetch stock prices, in seconds. Default: 60.
     * Comes from app.price-poll-interval-seconds in application.yaml.
     */
    private int pricePollIntervalSeconds = 60;
}