package com.beverage.payment.application.usecase;

import com.beverage.payment.application.dto.request.PaymentInitiateRequest;
import com.beverage.payment.application.dto.response.PaymentDetailResponse;
import com.beverage.payment.application.dto.response.PaymentUrlResponse;
import com.beverage.payment.infrastructure.event.dto.OrderCreatedEvent;

import java.util.Map;
import java.util.UUID;

public interface PaymentUseCase {
    PaymentUrlResponse initiatePayment(PaymentInitiateRequest request);
    void initiatePaymentFromEvent(OrderCreatedEvent event);
    PaymentDetailResponse getPaymentByOrderId(UUID orderId);
    Map<String, String> processVNPayIPN(Map<String, String> params);
    void handleVNPayCallback(Map<String, String> params);
    void expirePendingPayments();
}
