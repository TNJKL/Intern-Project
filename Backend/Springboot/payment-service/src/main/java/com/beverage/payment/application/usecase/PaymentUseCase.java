package com.beverage.payment.application.usecase;

import com.beverage.payment.application.dto.request.PaymentInitiateRequest;
import com.beverage.payment.application.dto.response.PaymentDetailResponse;
import com.beverage.payment.application.dto.response.PaymentUrlResponse;
import com.beverage.payment.domain.model.PaymentMethod;
import com.beverage.payment.domain.model.PaymentStatus;
import com.beverage.payment.infrastructure.event.dto.OrderCreatedEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public interface PaymentUseCase {
    PaymentUrlResponse initiatePayment(PaymentInitiateRequest request);
    void initiatePaymentFromEvent(OrderCreatedEvent event);
    PaymentDetailResponse getPaymentByOrderId(UUID orderId);
    Map<String, String> processVNPayIPN(Map<String, String> params);
    void handleVNPayCallback(Map<String, String> params);
    void expirePendingPayments();
    Page<PaymentDetailResponse> getPayments(
            UUID orderId,
            String orderCode,
            UUID userId,
            PaymentStatus status,
            PaymentMethod paymentMethod,
            Instant createdFrom,
            Instant createdTo,
            Pageable pageable
    );
    void updateOrderStatus(UUID orderId, String orderStatus);
    PaymentUrlResponse getOrRecreatePaymentUrl(UUID orderId, String ipAddress);
    PaymentDetailResponse getPendingRepayment(UUID userId, String orderCode);
    Page<PaymentDetailResponse> getPaymentHistory(UUID userId, Pageable pageable);
}
