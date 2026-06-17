package com.beverage.payment.presentation.controller;

import com.beverage.payment.application.dto.response.PaymentDetailResponse;
import com.beverage.payment.application.dto.response.PaymentUrlResponse;
import com.beverage.payment.application.usecase.PaymentUseCase;
import com.beverage.payment.common.ApiResponse;
import com.beverage.shared.jwt.JwtUserPrincipal;
import com.beverage.payment.domain.exception.BusinessException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
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
    public ResponseEntity<ApiResponse<PaymentUrlResponse>> getPaymentUrl(
            @PathVariable UUID orderId,
            jakarta.servlet.http.HttpServletRequest request
    ) {
        String ipAddress = request.getRemoteAddr();
        log.info("Customer fetching or recreating payment URL for orderId={} from IP={}", orderId, ipAddress);
        PaymentUrlResponse response = paymentUseCase.getOrRecreatePaymentUrl(orderId, ipAddress);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<PaymentDetailResponse>>> getPaymentHistory(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @PageableDefault(size = 10, sort = "createdAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable
    ) {
        if (principal == null) {
            throw new BusinessException("Yêu cầu không được xác thực.");
        }
        UUID userId = principal.getUserId();
        log.info("Customer {} fetching payment history", userId);
        Page<PaymentDetailResponse> page = paymentUseCase.getPaymentHistory(userId, pageable);
        return ResponseEntity.ok(ApiResponse.paged(page.getContent(), "Lấy lịch sử thanh toán thành công", page));
    }
}
