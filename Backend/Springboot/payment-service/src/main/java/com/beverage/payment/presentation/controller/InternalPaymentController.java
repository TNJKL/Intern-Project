package com.beverage.payment.presentation.controller;

import com.beverage.payment.application.dto.request.PaymentInitiateRequest;
import com.beverage.payment.application.dto.response.PaymentDetailResponse;
import com.beverage.payment.application.dto.response.PaymentUrlResponse;
import com.beverage.payment.application.usecase.PaymentUseCase;
import com.beverage.payment.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/internal/payments")
@RequiredArgsConstructor
@Slf4j
public class InternalPaymentController {

    private final PaymentUseCase paymentUseCase;

    @PostMapping("/initiate")
    public ResponseEntity<ApiResponse<PaymentUrlResponse>> initiatePayment(@Valid @RequestBody PaymentInitiateRequest request) {
        log.info("Internal request to initiate payment for orderCode={}", request.getOrderCode());
        PaymentUrlResponse response = paymentUseCase.initiatePayment(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<ApiResponse<PaymentDetailResponse>> getPaymentByOrderId(@PathVariable UUID orderId) {
        log.info("Internal request to fetch payment details for orderId={}", orderId);
        PaymentDetailResponse response = paymentUseCase.getPaymentByOrderId(orderId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/pending-repayment")
    public ResponseEntity<ApiResponse<PaymentDetailResponse>> getPendingRepayment(
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) String orderCode
    ) {
        log.info("Internal request to fetch pending repayment: userId={}, orderCode={}", userId, orderCode);
        PaymentDetailResponse response = paymentUseCase.getPendingRepayment(userId, orderCode);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
