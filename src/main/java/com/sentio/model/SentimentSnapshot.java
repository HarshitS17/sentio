package com.sentio.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;
import java.util.List;

/**
 * A pre-packaged summary of sentiment for one ticker — this is what the browser receives.
 * Bundles the rolling average, trend, and recent scored headlines into one object.
 *
 * Created by: SentimentAggregator (Phase 5) by combining multiple SentimentResults from Redis
 * Consumed by: SSE endpoint → Browser dashboard
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SentimentSnapshot {
    private String ticker;                          // stock symbol, e.g. "NVDA"
    private double rollingAverage;                  // average compound score over recent headlines
    private SentimentLabel trend;                   // overall mood: POSITIVE / NEGATIVE / NEUTRAL
    private int sampleCount;                        // how many headlines contributed to the average
    private List<SentimentResult> recentHeadlines;  // last few scored headlines for the dashboard feed
    private Instant generatedAt;                    // when this snapshot was assembled
}
