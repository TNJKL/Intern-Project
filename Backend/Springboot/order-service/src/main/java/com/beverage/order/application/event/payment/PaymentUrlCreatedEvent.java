package com.beverage.order.application.event.payment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class PaymentUrlCreatedEvent extends PaymentEventWrapper {
    @Builder.Default
    private String eventType = "PAYMENT_URL_CREATED";
    private UUID orderId;
    private String orderCode;
    private UUID userId;
    private BigDecimal amount;
    private String paymentUrl;
}
