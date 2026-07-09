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
import com.beverage.payment.infrastructure.persistence.repository.OutboxEventRepository;
import com.beverage.payment.infrastructure.persistence.entity.OutboxEventEntity;
import com.beverage.payment.infrastructure.event.dto.PaymentFailedEvent;
import com.beverage.payment.infrastructure.event.dto.PaymentEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RefundUseCaseImpl implements RefundUseCase {

    private final RefundJpaRepository refundRepository;
    private final PaymentJpaRepository paymentRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;

    private void saveOutboxEvent(UUID orderId, String eventType, PaymentEvent eventPayload) {
        try {
            UUID eventId = UUID.randomUUID();
            eventPayload.setEventId(eventId);
            
            String payloadJson = objectMapper.writeValueAsString(eventPayload);
            OutboxEventEntity outboxEvent = OutboxEventEntity.builder()
                    .id(eventId)
                    .aggregateType("payment")
                    .aggregateId(orderId.toString())
                    .eventType(eventType)
                    .payload(payloadJson)
                    .status("PENDING")
                    .build();
            outboxEventRepository.save(outboxEvent);
            log.info("Saved outbox event for refund: type={}, id={}, orderId={}", eventType, eventId, orderId);
        } catch (Exception e) {
            log.error("Failed to save outbox event for orderId={}", orderId, e);
            throw new BusinessException("Không thể ghi nhận sự kiện thanh toán hoàn tiền: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public PaymentDetailResponse createRefund(UUID paymentId, RefundCreateRequest request, UUID adminId) {
        log.info("Admin {} creating refund for paymentId={} amount={}", adminId, paymentId, request.getAmount());

        // Use lock to prevent concurrent refund cumulative calculation errors
        PaymentEntity payment = paymentRepository.findByIdWithLock(paymentId)
                .orElseThrow(() -> new PaymentNotFoundException("Payment record not found for id: " + paymentId));

        if (payment.getStatus() != PaymentStatus.SUCCESS && payment.getStatus() != PaymentStatus.PAID_BY_SHIPPER) {
            throw new BusinessException("Cannot refund a payment that is not successful or paid by shipper.");
        }

        // Validate refund amount is not greater than paid amount
        if (request.getAmount().compareTo(payment.getAmount()) > 0) {
            throw new BusinessException("Refund amount cannot exceed the original payment amount.");
        }

        // Check if this payment has already been refunded or compensated
        List<RefundEntity> existingRefunds = refundRepository.findByPaymentId(paymentId);
        boolean hasCompletedRefund = existingRefunds.stream()
                .anyMatch(r -> r.getStatus() == RefundStatus.COMPLETED);
        if (hasCompletedRefund) {
            throw new BusinessException("Giao dịch thanh toán này đã được hoàn tiền/đền bù trước đó.");
        }

        // Create refund record
        RefundEntity refund = RefundEntity.builder()
                .paymentId(paymentId)
                .orderId(payment.getOrderId())
                .orderCode(payment.getOrderCode())
                .userId(payment.getUserId())
                .amount(request.getAmount())
                .reason(request.getReason())
                .status(RefundStatus.COMPLETED) // Mock completion for VNPay sandbox / COD manual refund
                .requestedBy(adminId)
                .processedAt(Instant.now())
                .transactionId(UUID.randomUUID().toString()) // Mock external transaction ID
                .recipientType(request.getRecipientType() != null ? request.getRecipientType() : "CUSTOMER")
                .shipperName(request.getShipperName())
                .shipperPhone(request.getShipperPhone())
                .build();

        refundRepository.save(refund);
        payment.setStatus(PaymentStatus.REFUNDED);
        paymentRepository.save(payment);
        log.info("Refund created successfully with ID: {}", refund.getId());

        // Nếu là hoàn tiền toàn phần (100%), gửi sự kiện hủy đơn hàng sang order-service
        if (request.getAmount().compareTo(payment.getAmount()) == 0) {
            PaymentFailedEvent failedEvent = PaymentFailedEvent.builder()
                    .orderId(payment.getOrderId())
                    .orderCode(payment.getOrderCode())
                    .userId(payment.getUserId())
                    .amount(payment.getAmount())
                    .reason("Đơn hàng bị hoàn tiền toàn phần: " + request.getReason())
                    .terminal(true)
                    .occurredAt(Instant.now())
                    .build();
            saveOutboxEvent(payment.getOrderId(), "PaymentFailedEvent", failedEvent);
            log.info("Published PaymentFailedEvent to cancel orderId={} due to 100% refund", payment.getOrderId());
        }

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
            String orderCode,
            UUID userId,
            RefundStatus status,
            UUID requestedBy,
            String recipientType,
            Instant createdFrom,
            Instant createdTo,
            Pageable pageable
    ) {
        log.info("Searching refunds with filters: paymentId={}, orderId={}, orderCode={}, userId={}, status={}, requestedBy={}, recipientType={}",
                paymentId, orderId, orderCode, userId, status, requestedBy, recipientType);

        Specification<RefundEntity> spec = Specification
                .where(RefundSpecifications.withPaymentId(paymentId))
                .and(RefundSpecifications.withOrderId(orderId))
                .and(RefundSpecifications.withOrderCode(orderCode))
                .and(RefundSpecifications.withUserId(userId))
                .and(RefundSpecifications.withStatus(status))
                .and(RefundSpecifications.withRequestedBy(requestedBy))
                .and(RefundSpecifications.withRecipientType(recipientType))
                .and(RefundSpecifications.createdFrom(createdFrom))
                .and(RefundSpecifications.createdTo(createdTo));

        return refundRepository.findAll(spec, pageable)
                .map(RefundEntity::toDomain);
    }
}
