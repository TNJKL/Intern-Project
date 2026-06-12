package com.beverage.payment.presentation.controller;

import com.beverage.payment.application.dto.response.PaymentDetailResponse;
import com.beverage.payment.application.dto.response.PaymentUrlResponse;
import com.beverage.payment.application.usecase.PaymentUseCase;
import com.beverage.payment.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Slf4j
public class CustomerPaymentController {

    private final PaymentUseCase paymentUseCase;

    @GetMapping("/{orderId}/status")
    public ResponseEntity<ApiResponse<PaymentDetailResponse>> getPaymentStatus(@PathVariable UUID orderId) {
        log.info("Customer fetching status for orderId={}", orderId);
        PaymentDetailResponse response = paymentUseCase.getPaymentByOrderId(orderId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{orderId}/url")
    public ResponseEntity<ApiResponse<PaymentUrlResponse>> getPaymentUrl(@PathVariable UUID orderId) {
        log.info("Customer fetching payment URL for orderId={}", orderId);
        PaymentDetailResponse payment = paymentUseCase.getPaymentByOrderId(orderId);
        
        PaymentUrlResponse response = PaymentUrlResponse.builder()
                .orderId(payment.getOrderId())
                .orderCode(payment.getOrderCode())
                .paymentUrl(payment.getPaymentUrl())
                .build();
                
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
