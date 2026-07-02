package com.beverage.order.infrastructure.event;

import com.beverage.order.application.event.OrderCancelledEvent;
import com.beverage.order.application.event.OrderCompletedEvent;
import com.beverage.order.application.event.OrderCreatedEvent;
import com.beverage.order.application.event.OrderEventWrapper;
import com.beverage.order.application.event.OrderStatusChangedEvent;
import com.beverage.order.application.event.OrderTimeoutEvent;
import com.beverage.order.application.event.UserTierUpgradedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderEventPublisher {

    private final KafkaTemplate<String, OrderEventWrapper> kafkaTemplate;

    public void publish(OrderCreatedEvent event) {
        send(OrderTopics.ORDER_EVENTS, event.getOrderId().toString(), event);
    }

    public void publish(OrderStatusChangedEvent event) {
        send(OrderTopics.ORDER_EVENTS, event.getOrderId().toString(), event);
    }

    public void publish(OrderCancelledEvent event) {
        send(OrderTopics.ORDER_EVENTS, event.getOrderId().toString(), event);
    }

    public void publish(OrderCompletedEvent event) {
        send(OrderTopics.ORDER_EVENTS, event.getOrderId().toString(), event);
    }

    public void publish(OrderTimeoutEvent event) {
        send(OrderTopics.ORDER_TIMEOUT_EVENTS, event.getOrderId().toString(), event);
    }

    public void publish(UserTierUpgradedEvent event) {
        send(OrderTopics.ORDER_EVENTS, event.getUserId().toString(), event);
    }

    private void send(String topic, String key, OrderEventWrapper payload) {
        CompletableFuture<SendResult<String, OrderEventWrapper>> future =
                kafkaTemplate.send(topic, key, payload);

        future.whenComplete((result, ex) -> {
            if (ex != null) {
                log.error("Failed to send event to topic={} key={}: {}", topic, key, ex.getMessage());
            } else {
                log.info("Event sent to topic={} key={} partition={} offset={}",
                        topic, key,
                        result.getRecordMetadata().partition(),
                        result.getRecordMetadata().offset());
            }
        });
    }
}
