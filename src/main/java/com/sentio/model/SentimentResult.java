package com.sentio.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

/**
 * A headline that has been scored by VADER sentiment analysis.
 * This is the CORE OUTPUT of the pipeline — what the whole project produces.
 *
 * Created by: SentimentProcessorService (Phase 5) after running VADER on a NewsArticle
 * Stored in: Redis + Kafka "sentiment-out" topic
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SentimentResult {
    private String ticker;          // stock symbol, e.g. "AAPL"
    private String headline;        // the original headline text that was scored
    private float compound;         // VADER score: -1.0 (very negative) to +1.0 (very positive)
    private SentimentLabel label;   // classification derived from compound score
    private Instant timestamp;      // when the scoring was performed
}
