package com.beverage.payment.presentation.controller;

import com.beverage.payment.application.dto.request.PaymentInitiateRequest;
import com.beverage.payment.application.dto.response.PaymentDetailResponse;
import com.beverage.payment.application.dto.response.PaymentUrlResponse;
import com.beverage.payment.application.dto.response.PaymentInternalStatsResponse;
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
    private final com.beverage.payment.infrastructure.persistence.repository.PaymentJpaRepository paymentJpaRepository;
    private final com.beverage.payment.infrastructure.persistence.repository.RefundJpaRepository refundJpaRepository;

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

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<PaymentInternalStatsResponse>> getStats() {
        log.info("Internal request to fetch payment stats");

        java.math.BigDecimal totalRevenue = paymentJpaRepository.sumTotalRevenue();
        if (totalRevenue == null) {
            totalRevenue = java.math.BigDecimal.ZERO;
        }

        // Today start
        java.time.Instant todayStart = java.time.ZonedDateTime.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh"))
                .truncatedTo(java.time.temporal.ChronoUnit.DAYS)
                .toInstant();
        java.math.BigDecimal todayRevenue = paymentJpaRepository.sumRevenueAfter(todayStart);
        if (todayRevenue == null) {
            todayRevenue = java.math.BigDecimal.ZERO;
        }

        // Month start (1st day of month 00:00:00 Asia/Ho_Chi_Minh)
        java.time.Instant monthStart = java.time.ZonedDateTime.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh"))
                .withDayOfMonth(1)
                .truncatedTo(java.time.temporal.ChronoUnit.DAYS)
                .toInstant();
        java.math.BigDecimal thisMonthRevenue = paymentJpaRepository.sumRevenueAfter(monthStart);
        if (thisMonthRevenue == null) {
            thisMonthRevenue = java.math.BigDecimal.ZERO;
        }

        java.math.BigDecimal refundedAmount = refundJpaRepository.sumTotalRefunded();
        if (refundedAmount == null) {
            refundedAmount = java.math.BigDecimal.ZERO;
        }

        long refundCount = refundJpaRepository.countTotalRefunds();

        PaymentInternalStatsResponse responseData = PaymentInternalStatsResponse.builder()
                .totalRevenue(totalRevenue)
                .todayRevenue(todayRevenue)
                .thisMonthRevenue(thisMonthRevenue)
                .refundedAmount(refundedAmount)
                .refundCount(refundCount)
                .build();

        return ResponseEntity.ok(ApiResponse.success(responseData, "Lay du lieu thong ke thanh toan thanh cong"));
    }
}
