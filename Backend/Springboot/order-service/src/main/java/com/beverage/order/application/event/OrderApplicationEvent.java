package com.beverage.order.application.event;

import com.beverage.order.infrastructure.persistence.entity.OrderEntity;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

import java.time.Instant;

@Getter
public abstract class OrderApplicationEvent extends ApplicationEvent {

    private final Instant occurredAt;

    protected OrderApplicationEvent(Object source, Instant occurredAt) {
        super(source);
        this.occurredAt = occurredAt;
    }

    public static class OrderCreated extends OrderApplicationEvent {
        private final OrderEntity order;

        public OrderCreated(Object source, OrderEntity order) {
            super(source, Instant.now());
            this.order = order;
        }

        public OrderEntity getOrder() {
            return order;
        }
    }

    public static class OrderCancelled extends OrderApplicationEvent {
        private final OrderEntity order;
        private final String reason;

        public OrderCancelled(Object source, OrderEntity order, String reason) {
            super(source, Instant.now());
            this.order = order;
            this.reason = reason;
        }

        public OrderEntity getOrder() {
            return order;
        }

        public String getReason() {
            return reason;
        }
    }

    public static class OrderStatusChanged extends OrderApplicationEvent {
        private final OrderEntity order;
        private final com.beverage.order.domain.model.OrderStatus previousStatus;
        private final com.beverage.order.domain.model.OrderStatus newStatus;
        private final String note;

        public OrderStatusChanged(Object source, OrderEntity order,
                                  com.beverage.order.domain.model.OrderStatus previousStatus,
                                  com.beverage.order.domain.model.OrderStatus newStatus,
                                  String note) {
            super(source, Instant.now());
            this.order = order;
            this.previousStatus = previousStatus;
            this.newStatus = newStatus;
            this.note = note;
        }

        public OrderEntity getOrder() {
            return order;
        }

        public com.beverage.order.domain.model.OrderStatus getPreviousStatus() {
            return previousStatus;
        }

        public com.beverage.order.domain.model.OrderStatus getNewStatus() {
            return newStatus;
        }

        public String getNote() {
            return note;
        }
    }
}
