package com.sentio.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Bundles the latest price and the latest sentiment snapshot for one ticker
 * into a single response — lets the dashboard populate price + mood together
 * with one request on initial load, before the SSE connection takes over
 * for live sentiment updates.
 *
 * Not part of the original Phase 1-5 model set — added in Phase 6 to back
 * PriceController's combined "/full/{ticker}" endpoint.
 *
 * Either field may be null: price is null if YahooPricePoller hasn't polled
 * this ticker yet (or its 5-min TTL expired), sentiment is null if no
 * headline has been scored for it yet (or its 10-min TTL expired).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TickerFullSnapshot {
    private String ticker;
    private PriceTick price;
    private SentimentSnapshot sentiment;
}