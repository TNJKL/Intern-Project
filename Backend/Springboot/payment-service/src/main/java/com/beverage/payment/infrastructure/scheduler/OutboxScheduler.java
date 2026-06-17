package com.beverage.payment.infrastructure.scheduler;

import com.beverage.payment.infrastructure.event.dto.PaymentCompletedEvent;
import com.beverage.payment.infrastructure.event.dto.PaymentExpiredEvent;
import com.beverage.payment.infrastructure.event.dto.PaymentFailedEvent;
import com.beverage.payment.infrastructure.event.dto.PaymentUrlCreatedEvent;
import com.beverage.payment.infrastructure.event.producer.PaymentEventPublisher;
import com.beverage.payment.infrastructure.persistence.entity.OutboxEventEntity;
import com.beverage.payment.infrastructure.persistence.repository.OutboxEventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

    @Scheduled(fixedDelayString = "${app.payment.outbox-check-interval-ms:5000}")
    @Transactional
    public void processOutboxEvents() {
        List<OutboxEventEntity> pendingEvents = outboxEventRepository.findByStatusOrderByCreatedAtAsc("PENDING");
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
                log.info("Outbox event processed successfully: id={}, type={}", outboxEvent.getId(), outboxEvent.getEventType());
            } catch (Exception e) {
                log.error("Failed to process outbox event with id={}", outboxEvent.getId(), e);
                outboxEvent.setStatus("FAILED");
                outboxEventRepository.save(outboxEvent);
            }
        }
    }

    private void publishEvent(OutboxEventEntity outboxEvent) throws Exception {
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
