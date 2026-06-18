package com.beverage.payment.infrastructure.scheduler;

import com.beverage.payment.infrastructure.event.dto.PaymentCompletedEvent;
import com.beverage.payment.infrastructure.event.dto.PaymentExpiredEvent;
import com.beverage.payment.infrastructure.event.dto.PaymentFailedEvent;
import com.beverage.payment.infrastructure.event.dto.PaymentUrlCreatedEvent;
import com.beverage.payment.infrastructure.event.producer.PaymentEventPublisher;
import com.beverage.payment.infrastructure.persistence.entity.OutboxEventEntity;
import com.beverage.payment.infrastructure.persistence.repository.OutboxEventRepository;
import com.beverage.payment.infrastructure.config.PaymentConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class OutboxScheduler {

    private final OutboxEventRepository outboxEventRepository;
    private final PaymentEventPublisher eventPublisher;
    private final ObjectMapper objectMapper;
    private final PaymentConfig paymentConfig;

    @Scheduled(fixedDelayString = "${app.payment.outbox-check-interval-ms:5000}")
    @Transactional
    public void processOutboxEvents() {
        Pageable limit = PageRequest.of(0, paymentConfig.getOutboxBatchSize());
        List<OutboxEventEntity> pendingEvents = outboxEventRepository.findByStatusOrderByCreatedAtAsc("PENDING", limit);
        if (pendingEvents.isEmpty()) {
            return;
        }

        log.info("Found {} pending outbox events to publish", pendingEvents.size());

        for (OutboxEventEntity outboxEvent : pendingEvents) {
            try {
                publishEvent(outboxEvent);
                outboxEvent.setStatus("SENT");
                outboxEvent.setSentAt(Instant.now());
                outboxEventRepository.save(outboxEvent);
                log.info("Job 1 - Gui thanh cong su kien: id={}, kieu={}", outboxEvent.getId(), outboxEvent.getEventType());
            } catch (Exception e) {
                log.warn("Job 1 - Gui su kien that bai! Chuyen trang thai sang FAILED. Id={}, Loi: {}", outboxEvent.getId(), e.getMessage());
                outboxEvent.setStatus("FAILED");
                outboxEvent.setErrorMessage(e.getMessage());
                outboxEventRepository.save(outboxEvent);
            }
        }
    }

    private void publishEvent(OutboxEventEntity outboxEvent) throws Exception {
        if (paymentConfig.isSimulateOutboxError()) {
            throw new RuntimeException("MOCK ERROR: Gia lap loi ket noi mang phuc vu kiem thu outbox!");
        }
        String eventType = outboxEvent.getEventType();
        String payload = outboxEvent.getPayload();

        switch (eventType) {
            case "PaymentUrlCreatedEvent":
                PaymentUrlCreatedEvent urlCreatedEvent = objectMapper.readValue(payload, PaymentUrlCreatedEvent.class);
                eventPublisher.publishPaymentUrlCreated(urlCreatedEvent);
                break;
            case "PaymentCompletedEvent":
                PaymentCompletedEvent completedEvent = objectMapper.readValue(payload, PaymentCompletedEvent.class);
                eventPublisher.publishPaymentCompleted(completedEvent);
                break;
            case "PaymentFailedEvent":
                PaymentFailedEvent failedEvent = objectMapper.readValue(payload, PaymentFailedEvent.class);
                eventPublisher.publishPaymentFailed(failedEvent);
                break;
            case "PaymentExpiredEvent":
                PaymentExpiredEvent expiredEvent = objectMapper.readValue(payload, PaymentExpiredEvent.class);
                eventPublisher.publishPaymentExpired(expiredEvent);
                break;
            default:
                log.warn("Unknown event type for outbox event: {}", eventType);
                throw new IllegalArgumentException("Unknown event type: " + eventType);
        }
    }

    @Scheduled(fixedDelayString = "${app.payment.outbox-retry-interval-ms:60000}")
    @Transactional
    public void retryFailedEvents() {
        Pageable limit = PageRequest.of(0, paymentConfig.getOutboxBatchSize());
        List<OutboxEventEntity> failedEvents = outboxEventRepository.findByStatus("FAILED", limit);
        if (failedEvents.isEmpty()) {
            return;
        }

        log.info("Job 2 - Phat hien {} su kien loi can thu lai", failedEvents.size());

        for (OutboxEventEntity event : failedEvents) {
            if (event.getRetryCount() < event.getMaxRetry()) {
                // Chuyen lai PENDING va tang retry count de Job 1 quet lai
                event.setStatus("PENDING");
                event.setRetryCount(event.getRetryCount() + 1);
                outboxEventRepository.save(event);
                log.info("Job 2 - Thu lai su kien loi: Chuyen Event {} ve PENDING. Lan thu lai thu {}/{}", event.getId(), event.getRetryCount(), event.getMaxRetry());
            } else {
                // Chuyen sang DEAD_LETTER vi da qua so lan thu lai (Loi nang vinh vien)
                event.setStatus("DEAD_LETTER");
                outboxEventRepository.save(event);
                log.error("Job 2 - CRITICAL: Su kien outbox {} dat gioi han {} lan thu lai. Chuyen sang trang thai DEAD_LETTER! Loi cuoi cung: {}", 
                          event.getId(), event.getMaxRetry(), event.getErrorMessage());
            }
        }
    }

    /**
     * Dọn dẹp các event đã gửi thành công cách đây hơn 24h
     */
    @Scheduled(cron = "0 0 * * * *") // Chạy mỗi giờ
    @Transactional
    public void cleanUpSentEvents() {
        Instant threshold = Instant.now().minus(java.time.Duration.ofHours(24));
        try {
            outboxEventRepository.deleteByStatusAndCreatedAtBefore("SENT", threshold);
            log.info("Cleaned up sent outbox events older than {}", threshold);
        } catch (Exception e) {
            log.error("Failed to clean up sent outbox events", e);
        }
    }
}
