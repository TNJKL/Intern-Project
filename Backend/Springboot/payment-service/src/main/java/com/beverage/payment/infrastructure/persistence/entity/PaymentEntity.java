package com.beverage.payment.infrastructure.persistence.entity;

import com.beverage.payment.domain.model.Payment;
import com.beverage.payment.domain.model.PaymentMethod;
import com.beverage.payment.domain.model.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "order_id", nullable = false)
    private UUID orderId;

    @Column(name = "order_code", nullable = false, length = 30)
    private String orderCode;

    @Column(name = "user_id", nullable = true)
    private UUID userId;

    @Column(nullable = false, precision = 12)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 30)
    private PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PaymentStatus status;

    @Column(name = "transaction_id", length = 255)
    private String transactionId;

    @Column(name = "payment_url", length = 1000)
    private String paymentUrl;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "gateway_response", columnDefinition = "jsonb")
    private String gatewayResponse;

    @Column(name = "paid_at")
    private Instant paidAt;

    @Column(name = "idempotency_key", length = 100, unique = true)
    private String idempotencyKey;

    @Column(name = "expired_at")
    private Instant expiredAt;

    @Column(name = "order_status", length = 30)
    private String orderStatus;

    @Column(name = "retry_count", nullable = false)
    @Builder.Default
    private int retryCount = 0;

    @Column(name = "max_retry", nullable = false)
    @Builder.Default
    private int maxRetry = 2;

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
            status = PaymentStatus.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    public Payment toDomain() {
        return Payment.builder()
                .id(id)
                .orderId(orderId)
                .orderCode(orderCode)
                .userId(userId)
                .amount(amount)
                .paymentMethod(paymentMethod)
                .status(status)
                .transactionId(transactionId)
                .paymentUrl(paymentUrl)
                .gatewayResponse(gatewayResponse)
                .paidAt(paidAt)
                .idempotencyKey(idempotencyKey)
                .expiredAt(expiredAt)
                .orderStatus(orderStatus)
                .retryCount(retryCount)
                .maxRetry(maxRetry)
                .createdAt(createdAt)
                .updatedAt(updatedAt)
                .build();
    }

    public static PaymentEntity fromDomain(Payment domain) {
        if (domain == null) return null;
        return PaymentEntity.builder()
                .id(domain.getId())
                .orderId(domain.getOrderId())
                .orderCode(domain.getOrderCode())
                .userId(domain.getUserId())
                .amount(domain.getAmount())
                .paymentMethod(domain.getPaymentMethod())
                .status(domain.getStatus())
                .transactionId(domain.getTransactionId())
                .paymentUrl(domain.getPaymentUrl())
                .gatewayResponse(domain.getGatewayResponse())
                .paidAt(domain.getPaidAt())
                .idempotencyKey(domain.getIdempotencyKey())
                .expiredAt(domain.getExpiredAt())
                .orderStatus(domain.getOrderStatus())
                .retryCount(domain.getRetryCount())
                .maxRetry(domain.getMaxRetry())
                .createdAt(domain.getCreatedAt())
                .updatedAt(domain.getUpdatedAt())
                .build();
    }
}
