package com.beverage.order.infrastructure.config;

import com.beverage.order.application.event.OrderEventWrapper;
import com.beverage.order.application.event.OrderTimeoutEvent;
import com.beverage.order.infrastructure.event.OrderTopics;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.admin.AdminClientConfig;
import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.*;
import org.springframework.kafka.listener.CommonErrorHandler;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.kafka.support.serializer.ErrorHandlingDeserializer;
import org.springframework.kafka.support.serializer.JsonDeserializer;
import org.springframework.kafka.support.serializer.JsonSerializer;
import org.springframework.util.backoff.FixedBackOff;

import java.util.HashMap;
import java.util.Map;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class KafkaConfig {

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    @Bean
    public KafkaAdmin kafkaAdmin() {
        Map<String, Object> configs = Map.of(
                AdminClientConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers
        );
        return new KafkaAdmin(configs);
    }

    @Bean
    public NewTopic orderEventsTopic() {
        return TopicBuilder.name(OrderTopics.ORDER_EVENTS)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic orderTimeoutEventsTopic() {
        return TopicBuilder.name(OrderTopics.ORDER_TIMEOUT_EVENTS)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic inventoryEventsTopic() {
        return TopicBuilder.name(OrderTopics.INVENTORY_EVENTS)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public ObjectMapper kafkaObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        return mapper;
    }

    @Bean
    @Primary
    public ProducerFactory<String, OrderEventWrapper> producerFactory(ObjectMapper kafkaObjectMapper) {
        Map<String, Object> configProps = new HashMap<>();
        configProps.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        configProps.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        configProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        configProps.put(ProducerConfig.ACKS_CONFIG, "all");
        configProps.put(ProducerConfig.RETRIES_CONFIG, 3);
        configProps.put(JsonSerializer.ADD_TYPE_INFO_HEADERS, false);

        DefaultKafkaProducerFactory<String, OrderEventWrapper> factory =
                new DefaultKafkaProducerFactory<>(configProps, new StringSerializer(),
                        new JsonSerializer<>(kafkaObjectMapper));
        return factory;
    }

    @Bean
    @Primary
    public KafkaTemplate<String, OrderEventWrapper> kafkaTemplate(
            ProducerFactory<String, OrderEventWrapper> producerFactory) {
        return new KafkaTemplate<>(producerFactory);
    }

    @Bean
    public ConsumerFactory<String, OrderEventWrapper> orderEventConsumerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "order-service-consumer");
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, ErrorHandlingDeserializer.class);
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, ErrorHandlingDeserializer.class);
        props.put(ErrorHandlingDeserializer.KEY_DESERIALIZER_CLASS, StringDeserializer.class);
        props.put(ErrorHandlingDeserializer.VALUE_DESERIALIZER_CLASS, JsonDeserializer.class);
        props.put(JsonDeserializer.TRUSTED_PACKAGES, "com.beverage.order.application.event");
        props.put(JsonDeserializer.VALUE_DEFAULT_TYPE, OrderEventWrapper.class.getName());
        props.put(JsonDeserializer.USE_TYPE_INFO_HEADERS, false);
        props.put(JsonDeserializer.TYPE_MAPPINGS,
                "ORDER_COMPLETED:com.beverage.order.application.event.OrderCompletedEvent");

        return new DefaultKafkaConsumerFactory<>(
                props,
                new StringDeserializer(),
                new JsonDeserializer<>(OrderEventWrapper.class, kafkaObjectMapper(), false)
        );
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, OrderEventWrapper> kafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, OrderEventWrapper> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(orderEventConsumerFactory());
        factory.setConcurrency(3);
        factory.setCommonErrorHandler(errorHandler());
        return factory;
    }

    @Bean
    public CommonErrorHandler errorHandler() {
        return new DefaultErrorHandler((record, exception) -> {
            log.error("Failed to deserialize message at offset {} partition {} topic {}: {}",
                    record.offset(), record.partition(), record.topic(), exception.getMessage());
        }, new FixedBackOff(1000L, 2L));
    }

    @Bean
    public ConsumerFactory<String, com.beverage.order.application.event.OrderInventoryFailedEvent> inventoryFailedConsumerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "order-service-inventory-handler");
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, ErrorHandlingDeserializer.class);
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, ErrorHandlingDeserializer.class);
        props.put(ErrorHandlingDeserializer.KEY_DESERIALIZER_CLASS, StringDeserializer.class);
        props.put(ErrorHandlingDeserializer.VALUE_DESERIALIZER_CLASS, JsonDeserializer.class);
        props.put(JsonDeserializer.TRUSTED_PACKAGES, "com.beverage.order.application.event");
        props.put(JsonDeserializer.VALUE_DEFAULT_TYPE, com.beverage.order.application.event.OrderInventoryFailedEvent.class.getName());
        props.put(JsonDeserializer.USE_TYPE_INFO_HEADERS, false);

        JsonDeserializer<com.beverage.order.application.event.OrderInventoryFailedEvent> jsonDeserializer =
                new JsonDeserializer<>(com.beverage.order.application.event.OrderInventoryFailedEvent.class, kafkaObjectMapper(), false);
        ErrorHandlingDeserializer<com.beverage.order.application.event.OrderInventoryFailedEvent> errorHandlingDeserializer =
                new ErrorHandlingDeserializer<>(jsonDeserializer);

        return new DefaultKafkaConsumerFactory<>(
                props,
                new StringDeserializer(),
                errorHandlingDeserializer
        );
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, com.beverage.order.application.event.OrderInventoryFailedEvent> inventoryFailedListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, com.beverage.order.application.event.OrderInventoryFailedEvent> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(inventoryFailedConsumerFactory());
        factory.setConcurrency(3);
        factory.setCommonErrorHandler(errorHandler());
        return factory;
    }
}
