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
    public ResponseEntity<ApiResponse<PaymentInternalStatsResponse>> getStats(
            @RequestParam(value = "date", required = false) String dateString
    ) {
        log.info("Internal request to fetch payment stats for date={}", dateString);

        java.time.Instant startOfDay;
        java.time.Instant endOfDay;
        java.time.Instant startOfMonth;
        java.time.Instant endOfMonth;

        if (dateString == null || dateString.trim().isEmpty()) {
            java.time.ZonedDateTime nowVn = java.time.ZonedDateTime.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh"));
            startOfDay = nowVn.truncatedTo(java.time.temporal.ChronoUnit.DAYS).toInstant();
            endOfDay = nowVn.withHour(23).withMinute(59).withSecond(59).withNano(999999999).toInstant();

            startOfMonth = nowVn.withDayOfMonth(1).truncatedTo(java.time.temporal.ChronoUnit.DAYS).toInstant();
            endOfMonth = endOfDay;
        } else if (dateString.trim().length() == 7) {
            try {
                java.time.YearMonth yearMonth = java.time.YearMonth.parse(dateString.trim());
                startOfDay = yearMonth.atDay(1).atStartOfDay(java.time.ZoneId.of("Asia/Ho_Chi_Minh")).toInstant();
                endOfDay = yearMonth.atEndOfMonth().atTime(23, 59, 59, 999999999).atZone(java.time.ZoneId.of("Asia/Ho_Chi_Minh")).toInstant();

                startOfMonth = startOfDay;
                endOfMonth = endOfDay;
            } catch (Exception e) {
                log.error("Failed to parse month string: {}, fallback to today", dateString);
                java.time.ZonedDateTime nowVn = java.time.ZonedDateTime.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh"));
                startOfDay = nowVn.truncatedTo(java.time.temporal.ChronoUnit.DAYS).toInstant();
                endOfDay = nowVn.withHour(23).withMinute(59).withSecond(59).withNano(999999999).toInstant();

                startOfMonth = nowVn.withDayOfMonth(1).truncatedTo(java.time.temporal.ChronoUnit.DAYS).toInstant();
                endOfMonth = endOfDay;
            }
        } else {
            try {
                java.time.LocalDate localDate = java.time.LocalDate.parse(dateString.trim());
                startOfDay = localDate.atStartOfDay(java.time.ZoneId.of("Asia/Ho_Chi_Minh")).toInstant();
                endOfDay = localDate.atTime(23, 59, 59, 999999999).atZone(java.time.ZoneId.of("Asia/Ho_Chi_Minh")).toInstant();

                startOfMonth = localDate.withDayOfMonth(1).atStartOfDay(java.time.ZoneId.of("Asia/Ho_Chi_Minh")).toInstant();
                endOfMonth = endOfDay;
            } catch (Exception e) {
                log.error("Failed to parse date string: {}, fallback to today", dateString);
                java.time.ZonedDateTime nowVn = java.time.ZonedDateTime.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh"));
                startOfDay = nowVn.truncatedTo(java.time.temporal.ChronoUnit.DAYS).toInstant();
                endOfDay = nowVn.withHour(23).withMinute(59).withSecond(59).withNano(999999999).toInstant();

                startOfMonth = nowVn.withDayOfMonth(1).truncatedTo(java.time.temporal.ChronoUnit.DAYS).toInstant();
                endOfMonth = endOfDay;
            }
        }

        java.math.BigDecimal totalRevenue = paymentJpaRepository.sumTotalRevenue();
        if (totalRevenue == null) {
            totalRevenue = java.math.BigDecimal.ZERO;
        }

        java.math.BigDecimal todayRevenue = paymentJpaRepository.sumRevenueBetween(startOfDay, endOfDay);
        if (todayRevenue == null) {
            todayRevenue = java.math.BigDecimal.ZERO;
        }

        java.math.BigDecimal thisMonthRevenue = paymentJpaRepository.sumRevenueBetween(startOfMonth, endOfMonth);
        if (thisMonthRevenue == null) {
            thisMonthRevenue = java.math.BigDecimal.ZERO;
        }

        // Fetch refunded amounts
        java.math.BigDecimal totalRefunded = refundJpaRepository.sumTotalRefunded();
        if (totalRefunded == null) {
            totalRefunded = java.math.BigDecimal.ZERO;
        }

        java.math.BigDecimal todayRefunded = refundJpaRepository.sumRefundedBetween(startOfDay, endOfDay);
        if (todayRefunded == null) {
            todayRefunded = java.math.BigDecimal.ZERO;
        }

        java.math.BigDecimal thisMonthRefunded = refundJpaRepository.sumRefundedBetween(startOfMonth, endOfMonth);
        if (thisMonthRefunded == null) {
            thisMonthRefunded = java.math.BigDecimal.ZERO;
        }

        long refundCount = refundJpaRepository.countTotalRefunds();
        long todayRefundCount = refundJpaRepository.countRefundsBetween(startOfDay, endOfDay);
        long thisMonthRefundCount = refundJpaRepository.countRefundsBetween(startOfMonth, endOfMonth);

        // Calculate Net Revenues (Gross - Refunds)
        java.math.BigDecimal netTotalRevenue = totalRevenue.subtract(totalRefunded);
        java.math.BigDecimal netTodayRevenue = todayRevenue.subtract(todayRefunded);
        java.math.BigDecimal netThisMonthRevenue = thisMonthRevenue.subtract(thisMonthRefunded);

        PaymentInternalStatsResponse responseData = PaymentInternalStatsResponse.builder()
                .totalRevenue(netTotalRevenue)
                .todayRevenue(netTodayRevenue)
                .thisMonthRevenue(netThisMonthRevenue)
                .refundedAmount(totalRefunded)
                .refundCount(refundCount)
                .todayRefundedAmount(todayRefunded)
                .todayRefundCount(todayRefundCount)
                .thisMonthRefundedAmount(thisMonthRefunded)
                .thisMonthRefundCount(thisMonthRefundCount)
                .build();

        return ResponseEntity.ok(ApiResponse.success(responseData, "Lay du lieu thong ke thanh toan thanh cong"));
    }
}
