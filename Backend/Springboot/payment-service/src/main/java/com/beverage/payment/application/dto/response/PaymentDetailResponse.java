package com.beverage.payment.application.dto.response;

import com.beverage.payment.domain.model.Payment;
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
public class PaymentDetailResponse {
    private UUID id;
    private UUID orderId;
    private String orderCode;
    private UUID userId;
    private BigDecimal amount;
    private String paymentMethod;
    private String status;
    private String transactionId;
    private String paymentUrl;
    private Instant paidAt;
    private Instant createdAt;
    private Instant updatedAt;

    public static PaymentDetailResponse fromDomain(Payment payment) {
        if (payment == null) return null;
        return PaymentDetailResponse.builder()
                .id(payment.getId())
                .orderId(payment.getOrderId())
                .orderCode(payment.getOrderCode())
                .userId(payment.getUserId())
                .amount(payment.getAmount())
                .paymentMethod(payment.getPaymentMethod().name())
                .status(payment.getStatus().name())
                .transactionId(payment.getTransactionId())
                .paymentUrl(payment.getPaymentUrl())
                .paidAt(payment.getPaidAt())
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt())
                .build();
    }
}
