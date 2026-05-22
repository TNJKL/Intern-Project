package com.beverage.order.application.event;

import com.beverage.order.domain.model.OrderStatus;
import java.util.UUID;

public class OrderStatusChangedEvent extends OrderEventWrapper {

    public static final String EVENT_TYPE = "ORDER_STATUS_CHANGED";

    private String eventType;
    private UUID orderId;
    private String orderCode;
    private UUID userId;
    private String userEmail;
    private OrderStatus previousStatus;
    private OrderStatus currentStatus;
    private String note;

    public OrderStatusChangedEvent() {
        super();
    }

    @Override
    public String getEventType() {
        return EVENT_TYPE;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public UUID getOrderId() {
        return orderId;
    }

    public void setOrderId(UUID orderId) {
        this.orderId = orderId;
    }

    public String getOrderCode() {
        return orderCode;
    }

    public void setOrderCode(String orderCode) {
        this.orderCode = orderCode;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public OrderStatus getPreviousStatus() {
        return previousStatus;
    }

    public void setPreviousStatus(OrderStatus previousStatus) {
        this.previousStatus = previousStatus;
    }

    public OrderStatus getCurrentStatus() {
        return currentStatus;
    }

    public void setCurrentStatus(OrderStatus currentStatus) {
        this.currentStatus = currentStatus;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public static OrderStatusChangedEventBuilder builder() {
        return new OrderStatusChangedEventBuilder();
    }

    public static class OrderStatusChangedEventBuilder {
        private String eventType = EVENT_TYPE;
        private UUID orderId;
        private String orderCode;
        private UUID userId;
        private String userEmail;
        private OrderStatus previousStatus;
        private OrderStatus currentStatus;
        private String note;
        private java.time.Instant occurredAt;

        public OrderStatusChangedEventBuilder eventType(String eventType) {
            this.eventType = eventType;
            return this;
        }

        public OrderStatusChangedEventBuilder orderId(UUID orderId) {
            this.orderId = orderId;
            return this;
        }

        public OrderStatusChangedEventBuilder orderCode(String orderCode) {
            this.orderCode = orderCode;
            return this;
        }

        public OrderStatusChangedEventBuilder userId(UUID userId) {
            this.userId = userId;
            return this;
        }

        public OrderStatusChangedEventBuilder userEmail(String userEmail) {
            this.userEmail = userEmail;
            return this;
        }

        public OrderStatusChangedEventBuilder previousStatus(OrderStatus previousStatus) {
            this.previousStatus = previousStatus;
            return this;
        }

        public OrderStatusChangedEventBuilder currentStatus(OrderStatus currentStatus) {
            this.currentStatus = currentStatus;
            return this;
        }

        public OrderStatusChangedEventBuilder note(String note) {
            this.note = note;
            return this;
        }

        public OrderStatusChangedEventBuilder occurredAt(java.time.Instant occurredAt) {
            this.occurredAt = occurredAt;
            return this;
        }

        public OrderStatusChangedEvent build() {
            OrderStatusChangedEvent event = new OrderStatusChangedEvent();
            event.setEventType(this.eventType);
            event.setOrderId(this.orderId);
            event.setOrderCode(this.orderCode);
            event.setUserId(this.userId);
            event.setUserEmail(this.userEmail);
            event.setPreviousStatus(this.previousStatus);
            event.setCurrentStatus(this.currentStatus);
            event.setNote(this.note);
            event.setOccurredAt(this.occurredAt);
            return event;
        }
    }
}
