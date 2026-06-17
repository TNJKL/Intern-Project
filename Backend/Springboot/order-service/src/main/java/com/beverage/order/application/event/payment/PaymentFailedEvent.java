package com.beverage.order.application.event.payment;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class PaymentFailedEvent extends PaymentEventWrapper {
    private String eventType = "PAYMENT_FAILED";
    private UUID orderId;
    private String orderCode;
    private UUID userId;
    private BigDecimal amount;
    private String reason;
    private boolean terminal;

    @Override
    public String getEventType() {
        return eventType;
    }
}
