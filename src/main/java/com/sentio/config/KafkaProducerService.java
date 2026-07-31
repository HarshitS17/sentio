package com.sentio.config;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

/**
 * Reusable service for publishing any object to a Kafka topic as a JSON string.
 *
 * Uses com.fasterxml.jackson (Jackson 2.x) ObjectMapper — registered as a
 * @Primary bean in RedisConfig. Spring injects it here via @RequiredArgsConstructor.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class KafkaProducerService {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    /**
     * Publishes a payload object as JSON to the specified Kafka topic.
     *
     * @param topic   Kafka topic name (e.g. "raw-news", "price-tick")
     * @param key     message key — typically the ticker symbol, used for partitioning
     * @param payload the object to serialize and publish
     * @return Mono<Void> that completes when the send is acknowledged
     */
    public Mono<Void> send(String topic, String key, Object payload) {
        final String json;
        try {
            json = objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            log.error("JSON serialization failed for key=[{}]: {}", key, e.getMessage());
            return Mono.error(e);
        }

        return Mono.fromFuture(kafkaTemplate.send(topic, key, json).toCompletableFuture())
                .doOnSuccess(r -> log.debug("Sent to [{}] key=[{}]", topic, key))
                .doOnError(ex -> log.error("Failed to send to [{}] key=[{}]: {}", topic, key, ex.getMessage()))
                .then();
    }
}