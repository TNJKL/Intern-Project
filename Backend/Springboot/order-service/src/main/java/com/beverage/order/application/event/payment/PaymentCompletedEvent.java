package com.beverage.order.application.event.payment;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class PaymentCompletedEvent extends PaymentEventWrapper {
    private String eventType = "PAYMENT_COMPLETED";
    private UUID orderId;
    private String orderCode;
    private UUID userId;
    private BigDecimal amount;
    private String paymentMethod;
    private String transactionId;

    @Override
    public String getEventType() {
        return eventType;
    }
}
