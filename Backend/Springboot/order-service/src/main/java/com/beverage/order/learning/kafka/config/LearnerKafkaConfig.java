package com.beverage.order.learning.kafka.config;

import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.TopicPartition;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.*;
import org.springframework.kafka.listener.CommonErrorHandler;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.kafka.support.serializer.JsonDeserializer;
import org.springframework.kafka.support.serializer.JsonSerializer;
import org.springframework.util.backoff.FixedBackOff;

import java.util.HashMap;
import java.util.Map;

/**
 * Kafka Config riêng cho phần LEARNER
 *
 * Cấu hình:
 * - Retry 3 lần với delay 1 giây
 * - Sau 3 lần thất bại → đẩy sang Dead Letter Topic
 * - ErrorHandlingDeserializer cho deserialization errors
 */
@Configuration
@Profile("learner")
@Slf4j
public class LearnerKafkaConfig {

    // ===================== Producer cho DLQ =====================
    @Bean
    public ProducerFactory<String, String> dlqProducerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        return new DefaultKafkaProducerFactory<>(props);
    }

    @Bean
    public KafkaTemplate<String, String> dlqKafkaTemplate() {
        return new KafkaTemplate<>(dlqProducerFactory());
    }

    // ===================== Retry + DLQ Error Handler =====================
    /**
     * Retry config:
     * - 3 lần retry
     * - Delay 1 giây giữa mỗi lần retry
     *
     * Sau khi retry hết → DeadLetterPublishingRecoverer gửi message sang DLQ
     * DLQ topic = original topic + ".DLT"
     * VD: learn.kafka.retry → learn.kafka.retry.DLT
     */
    @Bean
    public CommonErrorHandler errorHandler(KafkaTemplate<String, String> dlqKafkaTemplate) {
        // Dead Letter Publishing Recoverer - gửi message lỗi sang DLQ
        DeadLetterPublishingRecoverer recoverer = new DeadLetterPublishingRecoverer(
                dlqKafkaTemplate,
                (record, exception) -> {
                    log.error("!!! Gửi message lỗi sang DLQ. Topic: {}, Partition: {}, Offset: {}",
                            record.topic(), record.partition(), record.offset());
                    log.error("!!! Exception: {}", exception.getMessage());
                    log.info(">>> DLQ topic: {}.DLT", record.topic());
                    return new TopicPartition(record.topic() + ".DLT", record.partition());
                }
        );

        // DefaultErrorHandler: retry 3 lần, mỗi lần delay 1000ms
        DefaultErrorHandler errorHandler = new DefaultErrorHandler(
                recoverer,
                new FixedBackOff(1000L, 3L)  // 1000ms delay, 3 retries
        );

        // Log mỗi lần retry
        errorHandler.setRetryListeners((record, ex, deliveryAttempt) -> {
            log.warn(">>> [RETRY {}] Lần {} thất bại. Message: {}. Exception: {}",
                    record.topic(), deliveryAttempt, record.value(), ex.getMessage());
        });

        return errorHandler;
    }

    // ===================== Consumer Factory cho deserialization error handling =====================
    @Bean
    public ConsumerFactory<String, String> learnerConsumerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(org.apache.kafka.clients.consumer.ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        props.put(org.apache.kafka.clients.consumer.ConsumerConfig.GROUP_ID_CONFIG, "learn-default");
        props.put(org.apache.kafka.clients.consumer.ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        props.put(org.apache.kafka.clients.consumer.ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(org.apache.kafka.clients.consumer.ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);

        return new DefaultKafkaConsumerFactory<>(props);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, String> kafkaListenerContainerFactory(
            CommonErrorHandler errorHandler,
            ConsumerFactory<String, String> learnerConsumerFactory) {

        ConcurrentKafkaListenerContainerFactory<String, String> factory =
                new ConcurrentKafkaListenerContainerFactory<>();

        factory.setConsumerFactory(learnerConsumerFactory);
        factory.setCommonErrorHandler(errorHandler);
        return factory;
    }
}
