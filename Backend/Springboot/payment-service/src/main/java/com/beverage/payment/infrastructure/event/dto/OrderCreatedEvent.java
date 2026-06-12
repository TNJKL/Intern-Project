package com.beverage.payment.infrastructure.event.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class OrderCreatedEvent extends OrderEventWrapper {

    public static final String EVENT_TYPE = "ORDER_CREATED";

    private String eventType = EVENT_TYPE;
    private UUID orderId;
    private String orderCode;
    private UUID userId;
    private String userEmail;
    private String userName;
    private String userPhone;
    private BigDecimal totalAmount;
    private String paymentMethod;
    private Instant paymentDeadline;

    @Override
    public String getEventType() {
        return EVENT_TYPE;
    }
}
