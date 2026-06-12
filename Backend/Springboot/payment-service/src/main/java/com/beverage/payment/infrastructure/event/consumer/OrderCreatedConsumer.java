package com.beverage.payment.infrastructure.event.consumer;

import com.beverage.payment.application.usecase.PaymentUseCase;
import com.beverage.payment.domain.exception.DuplicateEventException;
import com.beverage.payment.infrastructure.event.dto.OrderCreatedEvent;
import com.beverage.payment.infrastructure.event.dto.OrderEventWrapper;
import com.beverage.payment.infrastructure.persistence.entity.ProcessedEventEntity;
import com.beverage.payment.infrastructure.persistence.repository.ProcessedEventJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderCreatedConsumer {

    private final PaymentUseCase paymentUseCase;
    private final ProcessedEventJpaRepository processedEventRepository;

    @KafkaListener(
            topics = "${app.kafka.topics.order-events:order-events}",
            containerFactory = "kafkaListenerContainerFactory",
            groupId = "payment-service-group"
    )
    @Transactional
    public void listen(OrderEventWrapper event,
                       @Header(KafkaHeaders.RECEIVED_KEY) String key,
                       @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
                       @Header(KafkaHeaders.OFFSET) long offset) {
        
        log.info("Received Kafka event type={} key={} partition={} offset={}", event.getEventType(), key, partition, offset);

        // Chúng ta tạo eventId duy nhất từ key + offset hoặc dùng key chính là orderId
        // Ở đây eventId có thể lấy từ key làm định danh duy nhất (ví dụ: orderId) hoặc eventId có sẵn
        String eventId = event.getEventType() + "_" + key;

        if (processedEventRepository.existsById(eventId)) {
            log.warn("Event {} already processed. Skipping.", eventId);
            return;
        }

        try {
            if (event instanceof OrderCreatedEvent orderCreatedEvent) {
                paymentUseCase.initiatePaymentFromEvent(orderCreatedEvent);
            } else {
                log.debug("Skipping unhandled event type: {}", event.getEventType());
            }

            // Đánh dấu event đã xử lý thành công
            processedEventRepository.save(ProcessedEventEntity.builder()
                    .eventId(eventId)
                    .processedAt(Instant.now())
                    .build());

        } catch (DuplicateEventException e) {
            log.warn("Duplicate processing detected for event {}: {}", eventId, e.getMessage());
        } catch (Exception e) {
            log.error("Error processing event {}: {}", eventId, e.getMessage(), e);
            throw e; // Ném ra để Kafka Error Handler xử lý (đưa vào DLQ)
        }
    }
}
