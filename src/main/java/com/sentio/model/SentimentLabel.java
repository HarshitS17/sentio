package com.sentio.model;

/**
 * Classifies sentiment into one of three categories.
 * Used by SentimentResult and SentimentSnapshot to tag the mood of a headline or overall trend.
 */
public enum SentimentLabel {
    POSITIVE,   // compound score >= +0.05
    NEGATIVE,   // compound score <= -0.05
    NEUTRAL     // compound score between -0.05 and +0.05
}
