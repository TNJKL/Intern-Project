package com.beverage.payment.application.usecase;

import com.beverage.payment.application.dto.response.PaymentDetailResponse;
import com.beverage.payment.application.dto.request.RefundCreateRequest;
import com.beverage.payment.domain.model.Refund;
import com.beverage.payment.domain.model.RefundStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface RefundUseCase {
    PaymentDetailResponse createRefund(UUID paymentId, RefundCreateRequest request, UUID adminId);
    List<Refund> getRefundsByOrderId(UUID orderId);
    List<Refund> getRefundsByPaymentId(UUID paymentId);
    List<Refund> getAllRefunds();
    Page<Refund> getRefunds(
            UUID paymentId,
            UUID orderId,
            String orderCode,
            UUID userId,
            RefundStatus status,
            UUID requestedBy,
            String recipientType,
            Instant createdFrom,
            Instant createdTo,
            Pageable pageable
    );
}
