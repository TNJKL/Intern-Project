package com.beverage.payment.application.usecase;

import com.beverage.payment.application.dto.request.RefundCreateRequest;
import com.beverage.payment.application.dto.response.PaymentDetailResponse;
import com.beverage.payment.domain.exception.BusinessException;
import com.beverage.payment.domain.exception.PaymentNotFoundException;
import com.beverage.payment.domain.model.PaymentStatus;
import com.beverage.payment.domain.model.Refund;
import com.beverage.payment.domain.model.RefundStatus;
import com.beverage.payment.infrastructure.persistence.entity.PaymentEntity;
import com.beverage.payment.infrastructure.persistence.entity.RefundEntity;
import com.beverage.payment.infrastructure.persistence.repository.PaymentJpaRepository;
import com.beverage.payment.infrastructure.persistence.repository.RefundJpaRepository;
import com.beverage.payment.infrastructure.persistence.spec.RefundSpecifications;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RefundUseCaseImpl implements RefundUseCase {

    private final RefundJpaRepository refundRepository;
    private final PaymentJpaRepository paymentRepository;

    @Override
    @Transactional
    public PaymentDetailResponse createRefund(UUID paymentId, RefundCreateRequest request, UUID adminId) {
        log.info("Admin {} creating refund for paymentId={} amount={}", adminId, paymentId, request.getAmount());

        // Use lock to prevent concurrent refund cumulative calculation errors
        PaymentEntity payment = paymentRepository.findByIdWithLock(paymentId)
                .orElseThrow(() -> new PaymentNotFoundException("Payment record not found for id: " + paymentId));

        if (payment.getStatus() != PaymentStatus.SUCCESS) {
            throw new BusinessException("Cannot refund a payment that is not successful.");
        }

        // Validate refund amount is not greater than paid amount
        if (request.getAmount().compareTo(payment.getAmount()) > 0) {
            throw new BusinessException("Refund amount cannot exceed the original payment amount.");
        }

        // Check if there are already completed refunds for this payment and verify cumulative amount
        List<RefundEntity> existingRefunds = refundRepository.findByPaymentId(paymentId);
        BigDecimal totalRefunded = existingRefunds.stream()
                .filter(r -> r.getStatus() == RefundStatus.COMPLETED)
                .map(RefundEntity::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalRefunded.add(request.getAmount()).compareTo(payment.getAmount()) > 0) {
            throw new BusinessException("Cumulative refund amount cannot exceed the original payment amount.");
        }

        // Create refund record
        RefundEntity refund = RefundEntity.builder()
                .paymentId(paymentId)
                .orderId(payment.getOrderId())
                .userId(payment.getUserId())
                .amount(request.getAmount())
                .reason(request.getReason())
                .status(RefundStatus.COMPLETED) // Mock completion for VNPay sandbox
                .requestedBy(adminId)
                .processedAt(Instant.now())
                .transactionId(UUID.randomUUID().toString()) // Mock external transaction ID
                .build();

        refundRepository.save(refund);
        log.info("Refund created successfully with ID: {}", refund.getId());
        return PaymentDetailResponse.fromDomain(payment.toDomain());
    }

    @Override
    public List<Refund> getRefundsByOrderId(UUID orderId) {
        return refundRepository.findByOrderId(orderId).stream()
                .map(RefundEntity::toDomain)
                .toList();
    }

    @Override
    public List<Refund> getRefundsByPaymentId(UUID paymentId) {
        return refundRepository.findByPaymentId(paymentId).stream()
                .map(RefundEntity::toDomain)
                .toList();
    }

    @Override
    public List<Refund> getAllRefunds() {
        return refundRepository.findAll().stream()
                .map(RefundEntity::toDomain)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Refund> getRefunds(
            UUID paymentId,
            UUID orderId,
            UUID userId,
            RefundStatus status,
            UUID requestedBy,
            Instant createdFrom,
            Instant createdTo,
            Pageable pageable
    ) {
        log.info("Searching refunds with filters: paymentId={}, orderId={}, userId={}, status={}, requestedBy={}",
                paymentId, orderId, userId, status, requestedBy);

        Specification<RefundEntity> spec = Specification
                .where(RefundSpecifications.withPaymentId(paymentId))
                .and(RefundSpecifications.withOrderId(orderId))
                .and(RefundSpecifications.withUserId(userId))
                .and(RefundSpecifications.withStatus(status))
                .and(RefundSpecifications.withRequestedBy(requestedBy))
                .and(RefundSpecifications.createdFrom(createdFrom))
                .and(RefundSpecifications.createdTo(createdTo));

        return refundRepository.findAll(spec, pageable)
                .map(RefundEntity::toDomain);
    }
}
