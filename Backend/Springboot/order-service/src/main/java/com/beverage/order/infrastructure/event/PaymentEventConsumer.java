package com.beverage.order.infrastructure.event;

import com.beverage.order.application.event.payment.PaymentCompletedEvent;
import com.beverage.order.application.event.payment.PaymentEventWrapper;
import com.beverage.order.application.event.payment.PaymentExpiredEvent;
import com.beverage.order.application.event.payment.PaymentFailedEvent;
import com.beverage.order.application.event.payment.PaymentUrlCreatedEvent;
import com.beverage.order.application.usecase.OrderUseCase;
import com.beverage.order.infrastructure.persistence.entity.ProcessedEventEntity;
import com.beverage.order.infrastructure.persistence.repository.ProcessedEventJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentEventConsumer {

    private final OrderUseCase orderUseCase;
    private final ProcessedEventJpaRepository processedEventJpaRepository;
    private final TransactionTemplate transactionTemplate;

    @KafkaListener(
            topics = OrderTopics.PAYMENT_EVENTS,
            groupId = "order-service-payment-handler",
            containerFactory = "paymentEventListenerContainerFactory"
    )
    public void consume(ConsumerRecord<String, PaymentEventWrapper> record) {
        PaymentEventWrapper event = record.value();
        if (event == null) {
            log.warn("Received null payment event");
            return;
        }

        UUID eventId = event.getEventId();
        if (eventId == null) {
            log.warn("Received payment event type={} without eventId for orderId={}. Processing without idempotency check.",
                    event.getEventType(), event.getOrderId());
            try {
                processEventPayload(event);
            } catch (Exception e) {
                log.error("Failed to process payment event type={} orderId={}: {}", event.getEventType(), event.getOrderId(), e.getMessage(), e);
                throw e;
            }
            return;
        }

        String eventIdStr = eventId.toString();
        log.info("Received payment event type={} eventId={} for orderId={}", event.getEventType(), eventIdStr, event.getOrderId());

        try {
            transactionTemplate.executeWithoutResult(status -> {
                if (processedEventJpaRepository.existsById(eventIdStr)) {
                    log.info("Payment event type={} eventId={} for orderId={} has already been processed. Skipping.",
                            event.getEventType(), eventIdStr, event.getOrderId());
                    return;
                }

                processEventPayload(event);

                // Ghi nhận sự kiện đã xử lý thành công trong cùng transaction
                processedEventJpaRepository.save(ProcessedEventEntity.builder()
                        .eventId(eventIdStr)
                        .build());
                log.info("Successfully marked payment eventId={} as processed", eventIdStr);
            });
        } catch (Exception e) {
            log.error("Failed to process payment event type={} eventId={} orderId={}: {}",
                    event.getEventType(), eventIdStr, event.getOrderId(), e.getMessage(), e);
            throw e;
        }
    }

    private void processEventPayload(PaymentEventWrapper event) {
        if (event instanceof PaymentCompletedEvent completedEvent) {
            orderUseCase.confirmOrderFromPayment(completedEvent.getOrderId());
        } else if (event instanceof PaymentExpiredEvent expiredEvent) {
            orderUseCase.cancelOrderFromInventory(expiredEvent.getOrderId(), "Đơn hàng bị hủy do hết hạn thanh toán (quá 15 phút)");
        } else if (event instanceof PaymentFailedEvent failedEvent) {
            if (failedEvent.isTerminal()) {
                log.info("Payment failed terminally for orderId={}, canceling order. Reason: {}", failedEvent.getOrderId(), failedEvent.getReason());
                orderUseCase.cancelOrderFromInventory(failedEvent.getOrderId(), failedEvent.getReason());
            } else {
                log.info("Payment failed for orderId={}, keeping it pending to allow retry. Reason: {}", failedEvent.getOrderId(), failedEvent.getReason());
            }
        } else if (event instanceof PaymentUrlCreatedEvent urlCreatedEvent) {
            log.info("Payment URL recreated for orderId={}, extending payment deadline by 15 minutes", urlCreatedEvent.getOrderId());
            orderUseCase.extendOrderPaymentDeadline(urlCreatedEvent.getOrderId(), 15);
        }
    }
}
