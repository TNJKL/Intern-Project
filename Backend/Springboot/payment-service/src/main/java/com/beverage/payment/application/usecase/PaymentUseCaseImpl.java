package com.beverage.payment.application.usecase;

import com.beverage.payment.application.dto.request.PaymentInitiateRequest;
import com.beverage.payment.application.dto.response.PaymentDetailResponse;
import com.beverage.payment.application.dto.response.PaymentUrlResponse;
import com.beverage.payment.domain.exception.BusinessException;
import com.beverage.payment.domain.exception.InvalidPaymentAmountException;
import com.beverage.payment.domain.exception.PaymentNotFoundException;
import com.beverage.payment.domain.model.PaymentMethod;
import com.beverage.payment.domain.model.PaymentStatus;
import com.beverage.payment.infrastructure.event.dto.OrderCreatedEvent;
import com.beverage.payment.infrastructure.event.dto.PaymentCompletedEvent;
import com.beverage.payment.infrastructure.event.dto.PaymentEvent;
import com.beverage.payment.infrastructure.event.dto.PaymentExpiredEvent;
import com.beverage.payment.infrastructure.event.dto.PaymentFailedEvent;
import com.beverage.payment.infrastructure.event.dto.PaymentUrlCreatedEvent;
import com.beverage.payment.infrastructure.event.producer.PaymentEventPublisher;
import com.beverage.payment.infrastructure.persistence.entity.PaymentEntity;
import com.beverage.payment.infrastructure.persistence.repository.PaymentJpaRepository;
import com.beverage.payment.infrastructure.persistence.repository.RefundJpaRepository;
import com.beverage.payment.infrastructure.persistence.entity.OutboxEventEntity;
import com.beverage.payment.infrastructure.persistence.repository.OutboxEventRepository;
import com.beverage.payment.infrastructure.persistence.entity.RefundEntity;
import com.beverage.payment.domain.model.RefundStatus;
import com.beverage.payment.infrastructure.persistence.spec.PaymentSpecifications;
import com.beverage.payment.infrastructure.config.PaymentConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentUseCaseImpl implements PaymentUseCase {

    private final PaymentJpaRepository paymentRepository;
    private final RefundJpaRepository refundRepository;
    private final VNPayUseCase vnpayUseCase;
    private final PaymentEventPublisher eventPublisher;
    private final ObjectMapper objectMapper;
    private final PaymentConfig paymentConfig;
    private final OutboxEventRepository outboxEventRepository;

    @Override
    @Transactional
    public PaymentUrlResponse initiatePayment(PaymentInitiateRequest request) {
        log.info("Initiating payment for orderId={} amount={} method={}", request.getOrderId(), request.getAmount(), request.getPaymentMethod());

        PaymentMethod method;
        try {
            method = PaymentMethod.valueOf(request.getPaymentMethod().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Unsupported payment method: " + request.getPaymentMethod());
        }

        String idempotencyKey = "vnpay_order_" + request.getOrderCode();

        // Check if payment already exists
        PaymentEntity existingPayment = paymentRepository.findByOrderId(request.getOrderId()).orElse(null);

        if (existingPayment != null) {
            if (existingPayment.getStatus() == PaymentStatus.SUCCESS) {
                throw new BusinessException("Payment for order " + request.getOrderCode() + " has already succeeded.");
            }
            // If pending and URL exists, return the existing URL
            if (existingPayment.getStatus() == PaymentStatus.PENDING && existingPayment.getPaymentUrl() != null) {
                log.info("Payment already exists and is PENDING. Returning existing URL.");
                return PaymentUrlResponse.builder()
                        .orderId(existingPayment.getOrderId())
                        .orderCode(existingPayment.getOrderCode())
                        .paymentUrl(existingPayment.getPaymentUrl())
                        .build();
            }
        }

        // Generate payment URL if method is VNPAY
        String paymentUrl = "";
        Instant expiredAt = Instant.now().plusSeconds(paymentConfig.getExpirationMinutes() * 60L); // Default from config

        if (method == PaymentMethod.VNPAY) {
            paymentUrl = vnpayUseCase.generatePaymentUrl(request.getOrderCode(), request.getAmount(), request.getIpAddress());
        }

        PaymentEntity paymentEntity;
        if (existingPayment != null) {
            // Update existing pending payment
            existingPayment.setPaymentUrl(paymentUrl);
            existingPayment.setPaymentMethod(method);
            existingPayment.setAmount(request.getAmount());
            existingPayment.setExpiredAt(expiredAt);
            existingPayment.setOrderStatus("PENDING");
            existingPayment.setMaxRetry(paymentConfig.getMaxRetry());
            paymentEntity = paymentRepository.save(existingPayment);
        } else {
            // Create new payment entity
            paymentEntity = PaymentEntity.builder()
                    .orderId(request.getOrderId())
                    .orderCode(request.getOrderCode())
                    .userId(request.getUserId())
                    .amount(request.getAmount())
                    .paymentMethod(method)
                    .status(PaymentStatus.PENDING)
                    .paymentUrl(paymentUrl)
                    .idempotencyKey(idempotencyKey)
                    .expiredAt(expiredAt)
                    .orderStatus("PENDING")
                    .maxRetry(paymentConfig.getMaxRetry())
                    .build();
            paymentEntity = paymentRepository.save(paymentEntity);
        }

        return PaymentUrlResponse.builder()
                .orderId(paymentEntity.getOrderId())
                .orderCode(paymentEntity.getOrderCode())
                .paymentUrl(paymentEntity.getPaymentUrl())
                .build();
    }

    @Override
    @Transactional
    public void initiatePaymentFromEvent(OrderCreatedEvent event) {
        log.info("Processing OrderCreatedEvent for orderCode={}", event.getOrderCode());

        PaymentInitiateRequest request = new PaymentInitiateRequest();
        request.setOrderId(event.getOrderId());
        request.setOrderCode(event.getOrderCode());
        request.setUserId(event.getUserId());
        request.setAmount(event.getTotalAmount());
        request.setPaymentMethod(event.getPaymentMethod() != null ? event.getPaymentMethod() : "COD");
        request.setIpAddress("127.0.0.1"); // Default IP for background workers

        PaymentUrlResponse response = initiatePayment(request);

        // Publish event back to Kafka
        PaymentUrlCreatedEvent urlCreatedEvent = PaymentUrlCreatedEvent.builder()
                .orderId(response.getOrderId())
                .orderCode(response.getOrderCode())
                .userId(event.getUserId())
                .amount(event.getTotalAmount())
                .paymentUrl(response.getPaymentUrl())
                .occurredAt(Instant.now())
                .build();

        saveOutboxEvent(response.getOrderId(), "PaymentUrlCreatedEvent", urlCreatedEvent);
    }

    @Override
    public PaymentDetailResponse getPaymentByOrderId(UUID orderId) {
        PaymentEntity entity = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new PaymentNotFoundException("Payment details not found for orderId: " + orderId));
        return mapToDetailResponse(entity);
    }

    @Override
    @Transactional
    public Map<String, String> processVNPayIPN(Map<String, String> params) {
        log.info("Processing VNPay IPN params: {}", params);
        Map<String, String> response = new HashMap<>();

        // 1. Verify Signature
        if (!vnpayUseCase.verifySignature(params)) {
            response.put("RspCode", "97");
            response.put("Message", "Invalid Signature");
            return response;
        }

        String orderCode = params.get("vnp_TxnRef");
        String vnpAmountStr = params.get("vnp_Amount");
        String responseCode = params.get("vnp_ResponseCode");
        String transactionNo = params.get("vnp_TransactionNo");

        // 2. Find Payment
        PaymentEntity payment = paymentRepository.findByOrderCode(orderCode).orElse(null);
        if (payment == null) {
            response.put("RspCode", "01");
            response.put("Message", "Order not found");
            return response;
        }

        // 3. Check Amount (vnp_Amount is multiplied by 100)
        BigDecimal expectedAmount = payment.getAmount().multiply(BigDecimal.valueOf(100)).setScale(0);
        BigDecimal actualAmount = new BigDecimal(vnpAmountStr).setScale(0);
        if (expectedAmount.compareTo(actualAmount) != 0) {
            response.put("RspCode", "04");
            response.put("Message", "Invalid Amount");
            return response;
        }

        // 4. Check Status
        if (payment.getStatus() != PaymentStatus.PENDING) {
            response.put("RspCode", "02");
            response.put("Message", "Order already confirmed");
            return response;
        }

        // 5. Update Status
        try {
            String jsonResponse = objectMapper.writeValueAsString(params);
            payment.setGatewayResponse(jsonResponse);
            payment.setTransactionId(transactionNo);

            if ("00".equals(responseCode)) {
                payment.setStatus(PaymentStatus.SUCCESS);
                payment.setPaidAt(Instant.now());
                paymentRepository.save(payment);

                 // Publish completed event
                PaymentCompletedEvent completedEvent = PaymentCompletedEvent.builder()
                        .orderId(payment.getOrderId())
                        .orderCode(payment.getOrderCode())
                        .userId(payment.getUserId())
                        .amount(payment.getAmount())
                        .paymentMethod(PaymentMethod.VNPAY.name())
                        .transactionId(transactionNo)
                        .paidAt(payment.getPaidAt())
                        .occurredAt(Instant.now())
                        .build();
                saveOutboxEvent(payment.getOrderId(), "PaymentCompletedEvent", completedEvent);
            } else {
                boolean isTerminal = payment.getRetryCount() >= payment.getMaxRetry();
                payment.setStatus(PaymentStatus.FAILED);
                if (isTerminal) {
                    payment.setOrderStatus("CANCELLED");
                }
                paymentRepository.save(payment);

                // Publish failed event (terminal = true if all retries exhausted)
                PaymentFailedEvent failedEvent = PaymentFailedEvent.builder()
                        .orderId(payment.getOrderId())
                        .orderCode(payment.getOrderCode())
                        .userId(payment.getUserId())
                        .amount(payment.getAmount())
                        .reason(isTerminal ? 
                                "Bạn đã thử thanh toán quá số lần cho phép (" + payment.getMaxRetry() + " lần)." : 
                                "VNPay code: " + responseCode)
                        .terminal(isTerminal)
                        .occurredAt(Instant.now())
                        .build();
                saveOutboxEvent(payment.getOrderId(), "PaymentFailedEvent", failedEvent);
            }

            response.put("RspCode", "00");
            response.put("Message", "Confirm Success");

        } catch (Exception e) {
            log.error("Error writing gateway response JSON: {}", e.getMessage());
            response.put("RspCode", "99");
            response.put("Message", "Unknow Error");
        }

        return response;
    }

    @Override
    @Transactional
    public void handleVNPayCallback(Map<String, String> params) {
        log.info("Handling VNPay Callback params: {}", params);
        if (!vnpayUseCase.verifySignature(params)) {
            log.warn("VNPay Callback signature validation failed");
            return;
        }

        String orderCode = params.get("vnp_TxnRef");
        PaymentEntity payment = paymentRepository.findByOrderCode(orderCode).orElse(null);
        if (payment != null && payment.getStatus() == PaymentStatus.PENDING) {
            // Reuse IPN logic to process callback update
            processVNPayIPN(params);
        }
    }

    @Override
    @Transactional
    public void expirePendingPayments() {
        Instant now = Instant.now();
        List<PaymentEntity> expiredPayments = paymentRepository.findAllByStatusAndExpiredAtBefore(PaymentStatus.PENDING, now);

        if (expiredPayments.isEmpty()) {
            return;
        }

        log.info("Found {} expired pending payments to process", expiredPayments.size());

        for (PaymentEntity payment : expiredPayments) {
            payment.setStatus(PaymentStatus.EXPIRED);
            paymentRepository.save(payment);

            // Publish expired event to Kafka
            PaymentExpiredEvent expiredEvent = PaymentExpiredEvent.builder()
                    .orderId(payment.getOrderId())
                    .orderCode(payment.getOrderCode())
                    .userId(payment.getUserId())
                    .amount(payment.getAmount())
                    .occurredAt(Instant.now())
                    .build();
            saveOutboxEvent(payment.getOrderId(), "PaymentExpiredEvent", expiredEvent);

            log.info("Payment for orderCode={} marked as EXPIRED", payment.getOrderCode());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PaymentDetailResponse> getPayments(
            UUID orderId,
            String orderCode,
            UUID userId,
            PaymentStatus status,
            PaymentMethod paymentMethod,
            Instant createdFrom,
            Instant createdTo,
            Pageable pageable
    ) {
        log.info("Searching payments with filters: orderId={}, orderCode={}, userId={}, status={}, method={}",
                orderId, orderCode, userId, status, paymentMethod);
        
        Specification<PaymentEntity> spec = Specification
                .where(PaymentSpecifications.withOrderId(orderId))
                .and(PaymentSpecifications.withOrderCode(orderCode))
                .and(PaymentSpecifications.withUserId(userId))
                .and(PaymentSpecifications.withStatus(status))
                .and(PaymentSpecifications.withPaymentMethod(paymentMethod))
                .and(PaymentSpecifications.createdFrom(createdFrom))
                .and(PaymentSpecifications.createdTo(createdTo));

        return paymentRepository.findAll(spec, pageable)
                .map(this::mapToDetailResponse);
    }

    private PaymentDetailResponse mapToDetailResponse(PaymentEntity entity) {
        if (entity == null) return null;

        List<RefundEntity> refunds = refundRepository.findByPaymentId(entity.getId());
        BigDecimal totalRefunded = refunds.stream()
                .filter(r -> r.getStatus() == RefundStatus.COMPLETED)
                .map(RefundEntity::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        com.beverage.payment.domain.model.Payment domain = entity.toDomain();
        domain.setRefundedAmount(totalRefunded);

        return PaymentDetailResponse.fromDomain(domain);
    }

    @Override
    @Transactional
    public void updateOrderStatus(UUID orderId, String orderStatus) {
        log.info("Updating orderStatus={} for orderId={}", orderStatus, orderId);
        PaymentEntity payment = paymentRepository.findByOrderId(orderId).orElse(null);
        if (payment != null) {
            payment.setOrderStatus(orderStatus);
            
            // Nếu đơn hàng bị hủy (CANCELLED), chuyển trạng thái các thanh toán chưa hoàn tất sang FAILED
            if ("CANCELLED".equals(orderStatus)) {
                if (payment.getStatus() == PaymentStatus.PENDING || payment.getStatus() == PaymentStatus.PROCESSING) {
                    payment.setStatus(PaymentStatus.FAILED);
                    log.info("Order is CANCELLED. Updated payment status to FAILED for payment id={}", payment.getId());
                }
            }
            // Nếu đơn hàng COD chuyển sang COMPLETED và thanh toán đang PENDING -> cập nhật thành SUCCESS
            if ("COMPLETED".equals(orderStatus) 
                    && payment.getPaymentMethod() == PaymentMethod.COD 
                    && payment.getStatus() == PaymentStatus.PENDING) {
                payment.setStatus(PaymentStatus.SUCCESS);
                payment.setPaidAt(Instant.now());
                log.info("COD payment for orderId={} completed successfully. Status set to SUCCESS.", orderId);
            }
            
            paymentRepository.save(payment);
            log.info("Successfully updated orderStatus={} for payment id={}", orderStatus, payment.getId());
        } else {
            log.warn("Payment not found for orderId={} to update orderStatus={}", orderId, orderStatus);
        }
    }

    @Override
    @Transactional
    public PaymentUrlResponse getOrRecreatePaymentUrl(UUID orderId, String ipAddress) {
        log.info("Fetching or recreating payment URL for orderId={}", orderId);
        PaymentEntity payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new PaymentNotFoundException("Payment details not found for orderId: " + orderId));

        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            throw new BusinessException("Giao dịch thanh toán đã thành công.");
        }

        if ("CANCELLED".equals(payment.getOrderStatus())) {
            throw new BusinessException("Đơn hàng đã bị hủy, không thể tiếp tục thanh toán.");
        }

        // If PENDING and the URL has not expired yet, return it
        Instant now = Instant.now();
        if (payment.getStatus() == PaymentStatus.PENDING && payment.getExpiredAt() != null && payment.getExpiredAt().isAfter(now)) {
            log.info("Payment URL is still valid and PENDING. Returning existing URL.");
            return PaymentUrlResponse.builder()
                    .orderId(payment.getOrderId())
                    .orderCode(payment.getOrderCode())
                    .paymentUrl(payment.getPaymentUrl())
                    .build();
        }

        // Otherwise (status is FAILED, EXPIRED, or PENDING but URL expired), recreate a new VNPay URL
        log.info("Payment URL is expired or status is failed/expired. Re-initiating payment URL.");
        
        if (payment.getRetryCount() >= payment.getMaxRetry()) {
            payment.setOrderStatus("CANCELLED");
            payment.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);

            // Publish failed event to Kafka with terminal = true to cancel order
            PaymentFailedEvent failedEvent = PaymentFailedEvent.builder()
                    .orderId(payment.getOrderId())
                    .orderCode(payment.getOrderCode())
                    .userId(payment.getUserId())
                    .amount(payment.getAmount())
                    .reason("Bạn đã thử thanh toán quá số lần cho phép (" + payment.getMaxRetry() + " lần).")
                    .terminal(true)
                    .occurredAt(now)
                    .build();
            saveOutboxEvent(payment.getOrderId(), "PaymentFailedEvent", failedEvent);

            throw new BusinessException("Bạn đã thử thanh toán quá nhiều lần (" + payment.getMaxRetry() + " lần). Vui lòng đặt đơn hàng mới.");
        }

        String newUrl = vnpayUseCase.generatePaymentUrl(payment.getOrderCode(), payment.getAmount(), ipAddress);
        
        payment.setPaymentUrl(newUrl);
        payment.setStatus(PaymentStatus.PENDING);
        payment.setExpiredAt(now.plusSeconds(paymentConfig.getExpirationMinutes() * 60L)); // Reset countdown from config
        payment.setRetryCount(payment.getRetryCount() + 1); // retry_count + 1
        paymentRepository.save(payment);

        // Publish event back to Kafka to extend order deadline
        PaymentUrlCreatedEvent urlCreatedEvent = PaymentUrlCreatedEvent.builder()
                .orderId(payment.getOrderId())
                .orderCode(payment.getOrderCode())
                .userId(payment.getUserId())
                .amount(payment.getAmount())
                .paymentUrl(newUrl)
                .occurredAt(now)
                .build();
        saveOutboxEvent(payment.getOrderId(), "PaymentUrlCreatedEvent", urlCreatedEvent);
        log.info("Successfully recreated payment URL and published event for orderId={}", orderId);

        return PaymentUrlResponse.builder()
                .orderId(payment.getOrderId())
                .orderCode(payment.getOrderCode())
                .paymentUrl(newUrl)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentDetailResponse getPendingRepayment(UUID userId, String orderCode) {
        if (userId == null && (orderCode == null || orderCode.isBlank())) {
            return null;
        }

        Optional<PaymentEntity> paymentOpt;
        List<PaymentStatus> activeStatuses = List.of(PaymentStatus.PENDING, PaymentStatus.FAILED, PaymentStatus.EXPIRED);

        long pendingCount = 0;
        if (userId != null) {
            paymentOpt = paymentRepository.findActivePaymentByUserId(userId, activeStatuses);
            pendingCount = paymentOpt.isPresent() ? paymentRepository.countActivePaymentsByUserId(userId, activeStatuses) : 0;
        } else {
            paymentOpt = paymentRepository.findActivePaymentByOrderCode(orderCode, activeStatuses);
            pendingCount = paymentOpt.isPresent() ? paymentRepository.countActivePaymentsByOrderCode(orderCode, activeStatuses) : 0;
        }

        if (paymentOpt.isPresent()) {
            PaymentEntity payment = paymentOpt.get();
            if (payment.getRetryCount() < payment.getMaxRetry()) {
                PaymentDetailResponse response = mapToDetailResponse(payment);
                if (response != null) {
                    response.setTotalPendingCount((int) pendingCount);
                }
                return response;
            }
        }
        return null;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PaymentDetailResponse> getPaymentHistory(UUID userId, Pageable pageable) {
        log.info("Fetching payment history for userId={}", userId);
        return paymentRepository.findByUserIdAndPaymentMethodNotOrderByCreatedAtDesc(userId, PaymentMethod.COD, pageable)
                .map(this::mapToDetailResponse);
    }

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
            log.info("Saved outbox event: type={}, id={}, orderId={}", eventType, eventId, orderId);
        } catch (Exception e) {
            log.error("Failed to save outbox event for orderId={}", orderId, e);
            throw new BusinessException("Không thể ghi nhận sự kiện thanh toán: " + e.getMessage());
        }
    }
}
