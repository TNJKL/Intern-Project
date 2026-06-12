package com.beverage.payment.application.usecase;

import com.beverage.payment.application.dto.request.RefundCreateRequest;
import com.beverage.payment.domain.model.Refund;

import java.util.List;
import java.util.UUID;

public interface RefundUseCase {
    void createRefund(UUID paymentId, RefundCreateRequest request, UUID adminId);
    List<Refund> getRefundsByOrderId(UUID orderId);
    List<Refund> getRefundsByPaymentId(UUID paymentId);
    List<Refund> getAllRefunds();
}
