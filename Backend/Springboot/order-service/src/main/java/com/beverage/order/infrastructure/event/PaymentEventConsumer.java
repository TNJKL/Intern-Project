package com.beverage.order.infrastructure.event;

import com.beverage.order.application.event.payment.PaymentCompletedEvent;
import com.beverage.order.application.event.payment.PaymentEventWrapper;
import com.beverage.order.application.event.payment.PaymentExpiredEvent;
import com.beverage.order.application.event.payment.PaymentFailedEvent;
import com.beverage.order.application.event.payment.PaymentUrlCreatedEvent;
import com.beverage.order.application.usecase.OrderUseCase;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentEventConsumer {

    private final OrderUseCase orderUseCase;

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

        log.info("Received payment event type={} for orderId={}", event.getEventType(), event.getOrderId());

        try {
            if (event instanceof PaymentCompletedEvent completedEvent) {
                orderUseCase.confirmOrderFromPayment(completedEvent.getOrderId());
            } else if (event instanceof PaymentExpiredEvent expiredEvent) {
                orderUseCase.cancelOrderFromInventory(expiredEvent.getOrderId(), "Đơn hàng bị hủy do hết hạn thanh toán (quá 15 phút)");
            } else if (event instanceof PaymentFailedEvent failedEvent) {
                log.info("Payment failed for orderId={}, keeping it pending to allow retry. Reason: {}", failedEvent.getOrderId(), failedEvent.getReason());
            } else if (event instanceof PaymentUrlCreatedEvent urlCreatedEvent) {
                log.info("Payment URL recreated for orderId={}, extending payment deadline by 15 minutes", urlCreatedEvent.getOrderId());
                orderUseCase.extendOrderPaymentDeadline(urlCreatedEvent.getOrderId(), 15);
            }
        } catch (Exception e) {
            log.error("Failed to process payment event type={} orderId={}: {}", event.getEventType(), event.getOrderId(), e.getMessage(), e);
            throw e;
        }
    }
}
