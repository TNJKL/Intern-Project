package com.beverage.order.application.event;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class OrderCreatedEvent extends OrderEventWrapper {

    public static final String EVENT_TYPE = "ORDER_CREATED";

    private String eventType;
    private UUID orderId;
    private String orderCode;
    private UUID userId;
    private String userEmail;
    private String userName;
    private String userPhone;
    private BigDecimal totalAmount;
    private BigDecimal discountAmount;
    private List<OrderItemEventDto> items;
    private String paymentMethod;
    private Instant paymentDeadline;

    public OrderCreatedEvent() {
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

    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }

    public void setDiscountAmount(BigDecimal discountAmount) {
        this.discountAmount = discountAmount;
    }

    public List<OrderItemEventDto> getItems() {
        return items;
    }

    public void setItems(List<OrderItemEventDto> items) {
        this.items = items;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public Instant getPaymentDeadline() {
        return paymentDeadline;
    }

    public void setPaymentDeadline(Instant paymentDeadline) {
        this.paymentDeadline = paymentDeadline;
    }

    public static OrderCreatedEventBuilder builder() {
        return new OrderCreatedEventBuilder();
    }

    public static class OrderCreatedEventBuilder {
        private String eventType = EVENT_TYPE;
        private UUID orderId;
        private String orderCode;
        private UUID userId;
        private String userEmail;
        private String userName;
        private String userPhone;
        private BigDecimal totalAmount;
        private BigDecimal discountAmount;
        private List<OrderItemEventDto> items;
        private String paymentMethod;
        private Instant paymentDeadline;
        private Instant occurredAt;

        public OrderCreatedEventBuilder eventType(String eventType) {
            this.eventType = eventType;
            return this;
        }

        public OrderCreatedEventBuilder orderId(UUID orderId) {
            this.orderId = orderId;
            return this;
        }

        public OrderCreatedEventBuilder orderCode(String orderCode) {
            this.orderCode = orderCode;
            return this;
        }

        public OrderCreatedEventBuilder userId(UUID userId) {
            this.userId = userId;
            return this;
        }

        public OrderCreatedEventBuilder userEmail(String userEmail) {
            this.userEmail = userEmail;
            return this;
        }

        public OrderCreatedEventBuilder userName(String userName) {
            this.userName = userName;
            return this;
        }

        public OrderCreatedEventBuilder userPhone(String userPhone) {
            this.userPhone = userPhone;
            return this;
        }

        public OrderCreatedEventBuilder totalAmount(BigDecimal totalAmount) {
            this.totalAmount = totalAmount;
            return this;
        }

        public OrderCreatedEventBuilder discountAmount(BigDecimal discountAmount) {
            this.discountAmount = discountAmount;
            return this;
        }

        public OrderCreatedEventBuilder items(List<OrderItemEventDto> items) {
            this.items = items;
            return this;
        }

        public OrderCreatedEventBuilder paymentMethod(String paymentMethod) {
            this.paymentMethod = paymentMethod;
            return this;
        }

        public OrderCreatedEventBuilder paymentDeadline(Instant paymentDeadline) {
            this.paymentDeadline = paymentDeadline;
            return this;
        }

        public OrderCreatedEventBuilder occurredAt(Instant occurredAt) {
            this.occurredAt = occurredAt;
            return this;
        }

        public OrderCreatedEvent build() {
            OrderCreatedEvent event = new OrderCreatedEvent();
            event.setEventType(this.eventType);
            event.setOrderId(this.orderId);
            event.setOrderCode(this.orderCode);
            event.setUserId(this.userId);
            event.setUserEmail(this.userEmail);
            event.setUserName(this.userName);
            event.setUserPhone(this.userPhone);
            event.setTotalAmount(this.totalAmount);
            event.setDiscountAmount(this.discountAmount);
            event.setItems(this.items);
            event.setPaymentMethod(this.paymentMethod);
            event.setPaymentDeadline(this.paymentDeadline);
            event.setOccurredAt(this.occurredAt);
            return event;
        }
    }
}
