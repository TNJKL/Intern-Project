package com.beverage.inventory.infrastructure.event;

import com.beverage.inventory.application.dto.InventoryItemRequest;
import com.beverage.inventory.application.usecase.InventoryUseCase;
import com.beverage.inventory.domain.exception.BusinessException;
import com.beverage.inventory.infrastructure.event.dto.*;
import com.beverage.inventory.infrastructure.persistence.entity.ProcessedEventEntity;
import com.beverage.inventory.infrastructure.persistence.repository.ProcessedEventJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class KafkaConsumerService {

    private final InventoryUseCase inventoryUseCase;
    private final ProcessedEventJpaRepository processedEventJpaRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final TransactionTemplate transactionTemplate;

    @Value("${app.kafka.topics.inventory-events}")
    private String inventoryEventsTopicName;

    @KafkaListener(
            topics = {"${app.kafka.topics.order-events}", "${app.kafka.topics.order-timeout-events}"},
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void consume(ConsumerRecord<String, OrderEventWrapper> record) {
        String eventId = record.topic() + ":" + record.partition() + ":" + record.offset();
        log.info("Received event: {} with key={}", eventId, record.key());

        if (processedEventJpaRepository.existsById(eventId)) {
            log.warn("Event {} already processed. Skipping.", eventId);
            return;
        }

        OrderEventWrapper wrapper = record.value();
        if (wrapper == null) {
            return;
        }

        try {
            // Run transaction for stock deduction or restoration
            transactionTemplate.executeWithoutResult(status -> {
                processEvent(wrapper, eventId);
            });
        } catch (BusinessException e) {
            log.warn("Business rule violation when processing event {}: {}. Cancelling order.", eventId, e.getMessage());
            // Run separate transaction to publish failure and save idempotency key
            try {
                transactionTemplate.executeWithoutResult(status -> {
                    handleInventoryFailure(wrapper, e.getMessage(), eventId);
                });
            } catch (Exception ex) {
                log.error("Failed to handle inventory failure for event {}: {}", eventId, ex.getMessage(), ex);
                throw ex; // Let Kafka retry
            }
        } catch (Exception e) {
            log.error("Transient error when processing event {}: {}. Will retry.", eventId, e.getMessage(), e);
            throw e; // Rethrow to trigger Spring Kafka retry & DLQ
        }
    }

    private void processEvent(OrderEventWrapper wrapper, String eventId) {
        if (wrapper instanceof OrderCreatedEvent createdEvent) {
            log.info("Processing ORDER_CREATED for orderId={}", createdEvent.getOrderId());
            
            // Map OrderItemEventDto to InventoryItemRequest
            List<InventoryItemRequest> items = createdEvent.getItems().stream()
                    .map(item -> {
                        InventoryItemRequest req = new InventoryItemRequest();
                        req.setProductId(item.getProductId());
                        req.setVariantId(item.getVariantId());
                        req.setQuantity((int) item.getQuantity());
                        
                        if (item.getToppings() != null) {
                            List<UUID> toppingIds = item.getToppings().stream()
                                    .map(ToppingSnapshotDto::getToppingId)
                                    .toList();
                            req.setToppingIds(toppingIds);
                        }
                        return req;
                    })
                    .toList();

            // Perform atomic stock deduction
            inventoryUseCase.deductStock(createdEvent.getOrderId(), items);
            
            // Save idempotency key
            saveProcessedEvent(eventId);
            log.info("Successfully deducted stock for orderId={}", createdEvent.getOrderId());
            
        } else if (wrapper instanceof OrderCancelledEvent cancelledEvent) {
            log.info("Processing ORDER_CANCELLED for orderId={}", cancelledEvent.getOrderId());
            
            // Restore stock
            inventoryUseCase.restoreStock(cancelledEvent.getOrderId());
            
            // Save idempotency key
            saveProcessedEvent(eventId);
            log.info("Successfully restored stock for cancelled orderId={}", cancelledEvent.getOrderId());
            
        } else if (wrapper instanceof OrderTimeoutEvent timeoutEvent) {
            log.info("Processing ORDER_TIMEOUT for orderId={}", timeoutEvent.getOrderId());
            
            // Restore stock
            inventoryUseCase.restoreStock(timeoutEvent.getOrderId());
            
            // Save idempotency key
            saveProcessedEvent(eventId);
            log.info("Successfully restored stock for timed out orderId={}", timeoutEvent.getOrderId());
        }
    }

    private void handleInventoryFailure(OrderEventWrapper wrapper, String reason, String eventId) {
        if (wrapper instanceof OrderCreatedEvent createdEvent) {
            try {
                // Publish ORDER_INVENTORY_FAILED event to inventory-events topic
                OrderInventoryFailedEvent failedEvent = OrderInventoryFailedEvent.builder()
                        .orderId(createdEvent.getOrderId())
                        .reason(reason)
                        .build();

                kafkaTemplate.send(inventoryEventsTopicName, createdEvent.getOrderId().toString(), failedEvent);
                log.info("Published ORDER_INVENTORY_FAILED for orderId={} reason={}", createdEvent.getOrderId(), reason);
                
                // Mark event as processed so we don't process it again
                saveProcessedEvent(eventId);
            } catch (Exception ex) {
                log.error("Failed to publish inventory failure event for orderId={}: {}", createdEvent.getOrderId(), ex.getMessage(), ex);
                throw ex;
            }
        }
    }

    private void saveProcessedEvent(String eventId) {
        processedEventJpaRepository.save(ProcessedEventEntity.builder()
                .eventId(eventId)
                .build());
    }
}
