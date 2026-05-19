package com.beverage.order.infrastructure.event;

import com.beverage.order.application.event.OrderApplicationEvent;
import com.beverage.order.application.event.OrderCancelledEvent;
import com.beverage.order.application.event.OrderCompletedEvent;
import com.beverage.order.application.event.OrderCreatedEvent;
import com.beverage.order.application.event.OrderItemEventDto;
import com.beverage.order.application.event.OrderStatusChangedEvent;
import com.beverage.order.domain.model.OrderStatus;
import com.beverage.order.infrastructure.persistence.entity.OrderEntity;
import com.beverage.order.infrastructure.persistence.entity.OrderItemEntity;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.Instant;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderEventListener {

    private final OrderEventPublisher publisher;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onOrderCreated(OrderApplicationEvent.OrderCreated event) {
        OrderEntity order = event.getOrder();
        List<OrderItemEventDto> items = order.getItems().stream()
                .map(this::mapItem)
                .toList();

        OrderCreatedEvent payload = OrderCreatedEvent.builder()
                .eventType(OrderCreatedEvent.EVENT_TYPE)
                .orderId(order.getId())
                .orderCode(order.getOrderCode())
                .userId(order.getUserId())
                .userEmail(order.getUserEmail())
                .userName(order.getUserName())
                .userPhone(order.getUserPhone())
                .totalAmount(order.getTotalAmount())
                .items(items)
                .occurredAt(event.getOccurredAt())
                .build();

        publisher.publish(payload);
        log.info("Published OrderCreatedEvent orderCode={}", order.getOrderCode());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onOrderStatusChanged(OrderApplicationEvent.OrderStatusChanged event) {
        OrderEntity order = event.getOrder();
        OrderStatus newStatus = event.getNewStatus();

        if (newStatus == OrderStatus.COMPLETED) {
            publishOrderCompleted(order);
        } else {
            publishStatusChanged(order, event);
        }
    }

    private void publishStatusChanged(OrderEntity order, OrderApplicationEvent.OrderStatusChanged event) {
        OrderStatusChangedEvent payload = OrderStatusChangedEvent.builder()
                .eventType(OrderStatusChangedEvent.EVENT_TYPE)
                .orderId(order.getId())
                .orderCode(order.getOrderCode())
                .userId(order.getUserId())
                .userEmail(order.getUserEmail())
                .previousStatus(event.getPreviousStatus())
                .currentStatus(event.getNewStatus())
                .note(event.getNote())
                .occurredAt(event.getOccurredAt())
                .build();

        publisher.publish(payload);
        log.info("Published OrderStatusChangedEvent orderCode={} {}->{}",
                order.getOrderCode(), event.getPreviousStatus(), event.getNewStatus());
    }

    private void publishOrderCompleted(OrderEntity order) {
        List<OrderItemEventDto> items = order.getItems().stream()
                .map(this::mapItem)
                .toList();

        OrderCompletedEvent payload = OrderCompletedEvent.builder()
                .eventType(OrderCompletedEvent.EVENT_TYPE)
                .orderId(order.getId())
                .orderCode(order.getOrderCode())
                .userId(order.getUserId())
                .userEmail(order.getUserEmail())
                .userName(order.getUserName())
                .userPhone(order.getUserPhone())
                .totalAmount(order.getTotalAmount())
                .items(items)
                .occurredAt(Instant.now())
                .build();

        publisher.publish(payload);
        log.info("Published OrderCompletedEvent orderCode={}", order.getOrderCode());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onOrderCancelled(OrderApplicationEvent.OrderCancelled event) {
        OrderEntity order = event.getOrder();

        OrderCancelledEvent payload = OrderCancelledEvent.builder()
                .eventType(OrderCancelledEvent.EVENT_TYPE)
                .orderId(order.getId())
                .orderCode(order.getOrderCode())
                .userId(order.getUserId())
                .userEmail(order.getUserEmail())
                .userName(order.getUserName())
                .reason(event.getReason())
                .occurredAt(event.getOccurredAt())
                .build();

        publisher.publish(payload);
        log.info("Published OrderCancelledEvent orderCode={}", order.getOrderCode());
    }

    private OrderItemEventDto mapItem(OrderItemEntity item) {
        return OrderItemEventDto.builder()
                .productId(item.getProductId())
                .variantId(item.getVariantId())
                .variantLabel(item.getVariantLabel())
                .productName(item.getProductName())
                .toppings(item.getToppings())
                .unitPrice(item.getUnitPrice())
                .quantity(item.getQuantity())
                .subtotal(item.getSubtotal())
                .build();
    }
}
