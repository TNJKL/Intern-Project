package com.beverage.payment.infrastructure.event.producer;

import com.beverage.payment.infrastructure.event.dto.PaymentCompletedEvent;
import com.beverage.payment.infrastructure.event.dto.PaymentExpiredEvent;
import com.beverage.payment.infrastructure.event.dto.PaymentFailedEvent;
import com.beverage.payment.infrastructure.event.dto.PaymentUrlCreatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentEventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${app.kafka.topics.payment-events:payment-events}")
    private String paymentEventsTopic;

    public void publishPaymentUrlCreated(PaymentUrlCreatedEvent event) {
        publish(event.getOrderId().toString(), event);
        log.info("Published PaymentUrlCreatedEvent to topic={} for orderId={}", paymentEventsTopic, event.getOrderId());
    }

    public void publishPaymentCompleted(PaymentCompletedEvent event) {
        publish(event.getOrderId().toString(), event);
        log.info("Published PaymentCompletedEvent to topic={} for orderId={}", paymentEventsTopic, event.getOrderId());
    }

    public void publishPaymentFailed(PaymentFailedEvent event) {
        publish(event.getOrderId().toString(), event);
        log.info("Published PaymentFailedEvent to topic={} for orderId={}", paymentEventsTopic, event.getOrderId());
    }

    public void publishPaymentExpired(PaymentExpiredEvent event) {
        publish(event.getOrderId().toString(), event);
        log.info("Published PaymentExpiredEvent to topic={} for orderId={}", paymentEventsTopic, event.getOrderId());
    }

    private void publish(String key, Object event) {
        try {
            kafkaTemplate.send(paymentEventsTopic, key, event);
        } catch (Exception e) {
            log.error("Failed to publish event to topic={} key={} due to error: {}", paymentEventsTopic, key, e.getMessage(), e);
        }
    }
}
