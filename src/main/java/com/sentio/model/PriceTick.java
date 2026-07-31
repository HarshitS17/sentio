package com.sentio.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

/**
 * A snapshot of a stock's current price from Yahoo Finance.
 * Displayed alongside sentiment on the dashboard so users see price + mood together.
 *
 * Created by: YahooPricePoller (Phase 4)
 * Published to: Kafka "price-tick" topic
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PriceTick {
    private String ticker;                    // stock symbol, e.g. "TSLA"
    private double regularMarketPrice;        // current price, e.g. 178.52
    private double regularMarketChange;       // dollar change today, e.g. +3.21
    private double regularMarketChangePercent;// percent change today, e.g. +1.83
    private long regularMarketVolume;         // shares traded today, e.g. 52340000
    private Instant fetchedAt;                // when we polled this data
}
