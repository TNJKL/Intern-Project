package com.beverage.payment.infrastructure.event.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentExpiredEvent implements PaymentEvent {
    private UUID eventId;
    @Builder.Default
    private String eventType = "PAYMENT_EXPIRED";
    private UUID orderId;
    private String orderCode;
    private UUID userId;
    private BigDecimal amount;
    private Instant occurredAt;
}
