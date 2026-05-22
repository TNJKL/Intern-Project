package com.beverage.order.application.event;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public class OrderCompletedEvent extends OrderEventWrapper {

    public static final String EVENT_TYPE = "ORDER_COMPLETED";

    private String eventType;
    private UUID orderId;
    private String orderCode;
    private UUID userId;
    private String userEmail;
    private String userName;
    private String userPhone;
    private BigDecimal totalAmount;
    private List<OrderItemEventDto> items;

    public OrderCompletedEvent() {
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

    public String getUserPhone() {
        return userPhone;
    }

    public void setUserPhone(String userPhone) {
        this.userPhone = userPhone;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public List<OrderItemEventDto> getItems() {
        return items;
    }

    public void setItems(List<OrderItemEventDto> items) {
        this.items = items;
    }

    public static OrderCompletedEventBuilder builder() {
        return new OrderCompletedEventBuilder();
    }

    public static class OrderCompletedEventBuilder {
        private String eventType = EVENT_TYPE;
        private UUID orderId;
        private String orderCode;
        private UUID userId;
        private String userEmail;
        private String userName;
        private String userPhone;
        private BigDecimal totalAmount;
        private List<OrderItemEventDto> items;
        private java.time.Instant occurredAt;

        public OrderCompletedEventBuilder eventType(String eventType) {
            this.eventType = eventType;
            return this;
        }

        public OrderCompletedEventBuilder orderId(UUID orderId) {
            this.orderId = orderId;
            return this;
        }

        public OrderCompletedEventBuilder orderCode(String orderCode) {
            this.orderCode = orderCode;
            return this;
        }

        public OrderCompletedEventBuilder userId(UUID userId) {
            this.userId = userId;
            return this;
        }

        public OrderCompletedEventBuilder userEmail(String userEmail) {
            this.userEmail = userEmail;
            return this;
        }

        public OrderCompletedEventBuilder userName(String userName) {
            this.userName = userName;
            return this;
        }

        public OrderCompletedEventBuilder userPhone(String userPhone) {
            this.userPhone = userPhone;
            return this;
        }

        public OrderCompletedEventBuilder totalAmount(BigDecimal totalAmount) {
            this.totalAmount = totalAmount;
            return this;
        }

        public OrderCompletedEventBuilder items(List<OrderItemEventDto> items) {
            this.items = items;
            return this;
        }

        public OrderCompletedEventBuilder occurredAt(java.time.Instant occurredAt) {
            this.occurredAt = occurredAt;
            return this;
        }

        public OrderCompletedEvent build() {
            OrderCompletedEvent event = new OrderCompletedEvent();
            event.setEventType(this.eventType);
            event.setOrderId(this.orderId);
            event.setOrderCode(this.orderCode);
            event.setUserId(this.userId);
            event.setUserEmail(this.userEmail);
            event.setUserName(this.userName);
            event.setUserPhone(this.userPhone);
            event.setTotalAmount(this.totalAmount);
            event.setItems(this.items);
            event.setOccurredAt(this.occurredAt);
            return event;
        }
    }
}
