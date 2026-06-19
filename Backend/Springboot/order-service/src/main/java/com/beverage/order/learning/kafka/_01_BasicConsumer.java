package com.beverage.order.learning.kafka;

import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@Profile("learner")
@Slf4j
public class _01_BasicConsumer {

    /**
     * KafkaListener tự động subscribe topic "learn.kafka.basic"
     * Khi có message mới, Spring Kafka gọi method này
     *
     * @param record chứa key, value, partition, offset...
     */
    @KafkaListener(topics = "learn.kafka.basic", // order-event topic
            groupId = "learn-group-01" // consumer group id - các instance cùng group chia nhau message
    )

    public void consume(ConsumerRecord<String, String> record) {
        log.info("=== LESSON 1: BASIC CONSUMER ===");
        log.info("Topic    : {}", record.topic());
        log.info("Partition: {}", record.partition());
        log.info("Offset   : {}", record.offset());
        log.info("Key      : {}", record.key());
        log.info("Value    : {}", record.value());
        log.info("Timestamp: {}", record.timestamp());
        log.info("================================");
    }
}
