package com.beverage.payment.presentation.controller;

import com.beverage.payment.application.dto.request.RefundCreateRequest;
import com.beverage.payment.application.dto.response.PaymentDetailResponse;
import com.beverage.payment.application.usecase.PaymentUseCase;
import com.beverage.payment.application.usecase.RefundUseCase;
import com.beverage.payment.common.ApiResponse;
import com.beverage.payment.domain.model.Refund;
import com.beverage.payment.infrastructure.persistence.entity.PaymentEntity;
import com.beverage.payment.infrastructure.persistence.repository.PaymentJpaRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.beverage.shared.jwt.JwtUserPrincipal;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@Slf4j
public class AdminPaymentController {

    private final PaymentUseCase paymentUseCase;
    private final RefundUseCase refundUseCase;
    private final PaymentJpaRepository paymentRepository;

    @GetMapping("/payments")
    public ResponseEntity<ApiResponse<List<PaymentDetailResponse>>> getAllPayments() {
        log.info("Admin fetching all payment logs");
        List<PaymentDetailResponse> payments = paymentRepository.findAll().stream()
                .map(PaymentEntity::toDomain)
                .map(PaymentDetailResponse::fromDomain)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(payments));
    }

    @PostMapping("/payments/{id}/refund")
    public ResponseEntity<ApiResponse<Void>> refundPayment(
            @PathVariable("id") UUID paymentId,
            @Valid @RequestBody RefundCreateRequest request,
            @AuthenticationPrincipal JwtUserPrincipal principal
    ) {
        UUID adminId = principal != null ? principal.getUserId() : null;

        log.info("Admin {} requesting refund for paymentId={}", adminId, paymentId);
        refundUseCase.createRefund(paymentId, request, adminId);
        return ResponseEntity.ok(ApiResponse.success(null, "Yêu cầu hoàn tiền đã được xử lý thành công."));
    }

    @GetMapping("/refunds")
    public ResponseEntity<ApiResponse<List<Refund>>> getAllRefunds() {
        log.info("Admin fetching all refund logs");
        List<Refund> refunds = refundUseCase.getAllRefunds();
        return ResponseEntity.ok(ApiResponse.success(refunds));
    }
}
