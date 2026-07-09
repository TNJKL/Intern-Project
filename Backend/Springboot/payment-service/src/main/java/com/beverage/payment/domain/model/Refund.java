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
public class Refund {
    private UUID id;
    private UUID paymentId;
    private UUID orderId;
    private String orderCode;
    private UUID userId;
    private BigDecimal amount;
    private String reason;
    private RefundStatus status;
    private String transactionId;
    private UUID requestedBy;
    private Instant processedAt;
    private String recipientType;
    private String shipperName;
    private String shipperPhone;
    private Instant createdAt;
    private Instant updatedAt;
}
