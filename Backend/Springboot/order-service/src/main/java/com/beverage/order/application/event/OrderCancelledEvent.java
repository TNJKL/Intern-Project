package com.beverage.order.application.event;

import java.util.UUID;

public class OrderCancelledEvent extends OrderEventWrapper {

    public static final String EVENT_TYPE = "ORDER_CANCELLED";

    private String eventType;
    private UUID orderId;
    private String orderCode;
    private UUID userId;
    private String userEmail;
    private String userName;
    private String reason;

    public OrderCancelledEvent() {
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

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public static OrderCancelledEventBuilder builder() {
        return new OrderCancelledEventBuilder();
    }

    public static class OrderCancelledEventBuilder {
        private String eventType = EVENT_TYPE;
        private UUID orderId;
        private String orderCode;
        private UUID userId;
        private String userEmail;
        private String userName;
        private String reason;
        private java.time.Instant occurredAt;

        public OrderCancelledEventBuilder eventType(String eventType) {
            this.eventType = eventType;
            return this;
        }

        public OrderCancelledEventBuilder orderId(UUID orderId) {
            this.orderId = orderId;
            return this;
        }

        public OrderCancelledEventBuilder orderCode(String orderCode) {
            this.orderCode = orderCode;
            return this;
        }

        public OrderCancelledEventBuilder userId(UUID userId) {
            this.userId = userId;
            return this;
        }

        public OrderCancelledEventBuilder userEmail(String userEmail) {
            this.userEmail = userEmail;
            return this;
        }

        public OrderCancelledEventBuilder userName(String userName) {
            this.userName = userName;
            return this;
        }

        public OrderCancelledEventBuilder reason(String reason) {
            this.reason = reason;
            return this;
        }

        public OrderCancelledEventBuilder occurredAt(java.time.Instant occurredAt) {
            this.occurredAt = occurredAt;
            return this;
        }

        public OrderCancelledEvent build() {
            OrderCancelledEvent event = new OrderCancelledEvent();
            event.setEventType(this.eventType);
            event.setOrderId(this.orderId);
            event.setOrderCode(this.orderCode);
            event.setUserId(this.userId);
            event.setUserEmail(this.userEmail);
            event.setUserName(this.userName);
            event.setReason(this.reason);
            event.setOccurredAt(this.occurredAt);
            return event;
        }
    }
}
