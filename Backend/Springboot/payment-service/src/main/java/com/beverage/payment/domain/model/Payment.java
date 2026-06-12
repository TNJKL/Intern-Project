package com.beverage.payment.domain.model;

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
public class Payment {
    private UUID id;
    private UUID orderId;
    private String orderCode;
    private UUID userId;
    private BigDecimal amount;
    private PaymentMethod paymentMethod;
    private PaymentStatus status;
    private String transactionId;
    private String paymentUrl;
    private String gatewayResponse;
    private Instant paidAt;
    private String idempotencyKey;
    private Instant expiredAt;
    private Instant createdAt;
    private Instant updatedAt;

    public boolean isExpired() {
        return status == PaymentStatus.PENDING && expiredAt != null && expiredAt.isBefore(Instant.now());
    }
}
