package com.sentio.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * A raw news headline scraped from Yahoo Finance RSS.
 * This is the INPUT to the pipeline — it hasn't been scored yet.
 *
 * Created by: RssScraper (Phase 4)
 * Published to: Kafka "raw-news" topic
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NewsArticle {
    private String title;        // headline text, e.g. "Apple beats Q3 earnings"
    private String description;  // article summary/snippet from the RSS feed
    private Instant publishedAt; // when the article was originally published
    private String sourceUrl;    // link back to the full article
}
