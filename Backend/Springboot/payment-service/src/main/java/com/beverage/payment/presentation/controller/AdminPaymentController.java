package com.beverage.payment.presentation.controller;

import com.beverage.payment.application.dto.request.RefundCreateRequest;
import com.beverage.payment.application.dto.response.PaymentDetailResponse;
import com.beverage.payment.application.usecase.PaymentUseCase;
import com.beverage.payment.application.usecase.RefundUseCase;
import com.beverage.payment.common.ApiResponse;
import com.beverage.payment.domain.model.PaymentMethod;
import com.beverage.payment.domain.model.PaymentStatus;
import com.beverage.payment.domain.model.Refund;
import com.beverage.payment.domain.model.RefundStatus;
import com.beverage.payment.infrastructure.persistence.entity.PaymentEntity;
import com.beverage.payment.infrastructure.persistence.repository.PaymentJpaRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.beverage.shared.jwt.JwtUserPrincipal;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@Slf4j
public class AdminPaymentController {

    private final PaymentUseCase paymentUseCase;
    private final RefundUseCase refundUseCase;

    @GetMapping("/payments")
    public ResponseEntity<ApiResponse<List<PaymentDetailResponse>>> getAllPayments(
            @RequestParam(required = false) UUID orderId,
            @RequestParam(required = false) String orderCode,
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) PaymentStatus status,
            @RequestParam(required = false) PaymentMethod paymentMethod,
            @RequestParam(required = false) Instant createdFrom,
            @RequestParam(required = false) Instant createdTo,
            @PageableDefault(size = 10, sort = "createdAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable
    ) {
        log.info("Admin fetching payment logs with pagination and filters");
        Page<PaymentDetailResponse> page = paymentUseCase.getPayments(
                orderId, orderCode, userId, status, paymentMethod, createdFrom, createdTo, pageable
        );
        return ResponseEntity.ok(ApiResponse.paged(page.getContent(), "Lấy danh sách giao dịch thành công", page));
    }

    @PostMapping("/payments/{id}/refund")
    public ResponseEntity<ApiResponse<PaymentDetailResponse>> refundPayment(
            @PathVariable("id") UUID paymentId,
            @Valid @RequestBody RefundCreateRequest request,
            @AuthenticationPrincipal JwtUserPrincipal principal
    ) {
        UUID adminId = principal != null ? principal.getUserId() : null;

        log.info("Admin {} requesting refund for paymentId={}", adminId, paymentId);
        PaymentDetailResponse updatedPayment = refundUseCase.createRefund(paymentId, request, adminId);
        return ResponseEntity.ok(ApiResponse.success(updatedPayment, "Yêu cầu hoàn tiền đã được xử lý thành công."));
    }

    @GetMapping("/refunds")
    public ResponseEntity<ApiResponse<List<Refund>>> getAllRefunds(
            @RequestParam(required = false) UUID paymentId,
            @RequestParam(required = false) UUID orderId,
            @RequestParam(required = false) String orderCode,
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) RefundStatus status,
            @RequestParam(required = false) UUID requestedBy,
            @RequestParam(required = false) String recipientType,
            @RequestParam(required = false) Instant createdFrom,
            @RequestParam(required = false) Instant createdTo,
            @PageableDefault(size = 10, sort = "createdAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable
    ) {
        log.info("Admin fetching refund logs with pagination and filters: orderCode={}, recipientType={}", orderCode, recipientType);
        Page<Refund> page = refundUseCase.getRefunds(
                paymentId, orderId, orderCode, userId, status, requestedBy, recipientType, createdFrom, createdTo, pageable
        );
        return ResponseEntity.ok(ApiResponse.paged(page.getContent(), "Lấy danh sách hoàn tiền thành công", page));
    }
}
