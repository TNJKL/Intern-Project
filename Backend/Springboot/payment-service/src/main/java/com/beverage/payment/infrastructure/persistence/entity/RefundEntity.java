package com.beverage.payment.infrastructure.persistence.entity;

import com.beverage.payment.domain.model.Refund;
import com.beverage.payment.domain.model.RefundStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "refunds")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefundEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "payment_id", nullable = false)
    private UUID paymentId;

    @Column(name = "order_id", nullable = false)
    private UUID orderId;

    @Column(name = "user_id", nullable = true)
    private UUID userId;

    @Column(nullable = false, precision = 12)
    private BigDecimal amount;

    @Column(nullable = false, columnDefinition = "text")
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private RefundStatus status;

    @Column(name = "transaction_id", length = 255)
    private String transactionId;

    @Column(name = "requested_by")
    private UUID requestedBy;

    @Column(name = "processed_at")
    private Instant processedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
        if (status == null) {
            status = RefundStatus.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    public Refund toDomain() {
        return Refund.builder()
                .id(id)
                .paymentId(paymentId)
                .orderId(orderId)
                .userId(userId)
                .amount(amount)
                .reason(reason)
                .status(status)
                .transactionId(transactionId)
                .requestedBy(requestedBy)
                .processedAt(processedAt)
                .createdAt(createdAt)
                .updatedAt(updatedAt)
                .build();
    }

    public static RefundEntity fromDomain(Refund domain) {
        if (domain == null) return null;
        return RefundEntity.builder()
                .id(domain.getId())
                .paymentId(domain.getPaymentId())
                .orderId(domain.getOrderId())
                .userId(domain.getUserId())
                .amount(domain.getAmount())
                .reason(domain.getReason())
                .status(domain.getStatus())
                .transactionId(domain.getTransactionId())
                .requestedBy(domain.getRequestedBy())
                .processedAt(domain.getProcessedAt())
                .createdAt(domain.getCreatedAt())
                .updatedAt(domain.getUpdatedAt())
                .build();
    }
}
