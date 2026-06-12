package com.beverage.order.application.event.payment;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class PaymentExpiredEvent extends PaymentEventWrapper {
    private String eventType = "PAYMENT_EXPIRED";
    private UUID orderId;
    private String orderCode;
    private UUID userId;
    private BigDecimal amount;

    @Override
    public String getEventType() {
        return eventType;
    }
}
