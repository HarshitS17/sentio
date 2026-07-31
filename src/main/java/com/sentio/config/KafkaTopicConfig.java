package com.sentio.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

/**
 * Declares 3 Kafka topics that Spring will auto-create on startup.
 * Think of topics as named channels: producers write to them, consumers read from them.
 *
 * - raw-news:      RSS scraper publishes scraped headlines here
 * - price-tick:    Price poller publishes stock price snapshots here
 * - sentiment-out: Sentiment processor publishes scored results here
 */
@Configuration
public class KafkaTopicConfig {

    @Bean
    public NewTopic rawNewsTopic() {
        return TopicBuilder.name("raw-news")
                .partitions(1)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic priceTickTopic() {
        return TopicBuilder.name("price-tick")
                .partitions(1)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic sentimentOutTopic() {
        return TopicBuilder.name("sentiment-out")
                .partitions(1)
                .replicas(1)
                .build();
    }
}
