package com.beverage.order.application.event;

import java.time.Instant;
import java.util.UUID;

public class OrderTimeoutEvent extends OrderEventWrapper {

    public static final String EVENT_TYPE = "ORDER_TIMEOUT";

    private String eventType;
    private UUID orderId;
    private String orderCode;
    private UUID userId;
    private String userEmail;
    private String userName;
    private Instant paymentDeadline;
    private Instant expiredAt;

    public OrderTimeoutEvent() {
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

    public Instant getPaymentDeadline() {
        return paymentDeadline;
    }

    public void setPaymentDeadline(Instant paymentDeadline) {
        this.paymentDeadline = paymentDeadline;
    }

    public Instant getExpiredAt() {
        return expiredAt;
    }

    public void setExpiredAt(Instant expiredAt) {
        this.expiredAt = expiredAt;
    }

    public static OrderTimeoutEventBuilder builder() {
        return new OrderTimeoutEventBuilder();
    }

    public static class OrderTimeoutEventBuilder {
        private String eventType = EVENT_TYPE;
        private UUID orderId;
        private String orderCode;
        private UUID userId;
        private String userEmail;
        private String userName;
        private Instant paymentDeadline;
        private Instant expiredAt;

        public OrderTimeoutEventBuilder eventType(String eventType) {
            this.eventType = eventType;
            return this;
        }

        public OrderTimeoutEventBuilder orderId(UUID orderId) {
            this.orderId = orderId;
            return this;
        }

        public OrderTimeoutEventBuilder orderCode(String orderCode) {
            this.orderCode = orderCode;
            return this;
        }

        public OrderTimeoutEventBuilder userId(UUID userId) {
            this.userId = userId;
            return this;
        }

        public OrderTimeoutEventBuilder userEmail(String userEmail) {
            this.userEmail = userEmail;
            return this;
        }

        public OrderTimeoutEventBuilder userName(String userName) {
            this.userName = userName;
            return this;
        }

        public OrderTimeoutEventBuilder paymentDeadline(Instant paymentDeadline) {
            this.paymentDeadline = paymentDeadline;
            return this;
        }

        public OrderTimeoutEventBuilder expiredAt(Instant expiredAt) {
            this.expiredAt = expiredAt;
            return this;
        }

        public OrderTimeoutEvent build() {
            OrderTimeoutEvent event = new OrderTimeoutEvent();
            event.setEventType(this.eventType);
            event.setOrderId(this.orderId);
            event.setOrderCode(this.orderCode);
            event.setUserId(this.userId);
            event.setUserEmail(this.userEmail);
            event.setUserName(this.userName);
            event.setPaymentDeadline(this.paymentDeadline);
            event.setExpiredAt(this.expiredAt);
            return event;
        }
    }
}
