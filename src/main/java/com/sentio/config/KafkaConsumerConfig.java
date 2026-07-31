package com.sentio.config;

import org.springframework.boot.kafka.autoconfigure.KafkaProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import reactor.kafka.receiver.KafkaReceiver;
import reactor.kafka.receiver.ReceiverOptions;

import java.util.Collections;

/**
 * Sets up a reactive Kafka consumer using Reactor Kafka.
 *
 * Why not just use @KafkaListener? That annotation is blocking — it runs on a
 * thread pool. Since Sentio uses WebFlux  (reactive), we need the consumer to
 * also be reactive so the entire pipeline stays non-blocking.
 *
 * ReceiverOptions = Reactor Kafka's config object (like a builder for the consumer).
 * KafkaReceiver = Reactor Kafka's reactive consumer — gives us a Flux of recoxrds.
 *
 * Note: Spring Kafka 4.x removed ReactiveKafkaConsumerTemplate, so we use
 * KafkaReceiver directly (which is what the template was wrapping anyway).
 */
@Configuration
public class KafkaConsumerConfig {

    /**
     * Builds ReceiverOptions from the properties already defined in application.yaml
     * (bootstrap-servers, group-id, deserializers). We subscribe to the "raw-news"
     * topic here — the sentiment processor will receive messages from this topic.
     */
    @Bean
    public ReceiverOptions<String, String> receiverOptions(KafkaProperties kafkaProperties) {
        ReceiverOptions<String, String> basicOptions = ReceiverOptions.create(
                kafkaProperties.buildConsumerProperties()
        );
        return basicOptions.subscription(Collections.singletonList("raw-news"));
    }

    /**
     * The actual reactive Kafka receiver that the SentimentProcessorService (Phase 5)
     * will inject. It provides a Flux of Kafka records from the "raw-news" topic.
     */
    @Bean
    public KafkaReceiver<String, String> kafkaReceiver(ReceiverOptions<String, String> receiverOptions) {
        return KafkaReceiver.create(receiverOptions);
    }
}
