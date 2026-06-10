package com.beverage.order.infrastructure.event;

import com.beverage.order.application.event.OrderInventoryFailedEvent;
import com.beverage.order.application.usecase.OrderUseCase;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class InventoryFailedConsumer {

    private final OrderUseCase orderUseCase;

    @KafkaListener(
            topics = OrderTopics.INVENTORY_EVENTS,
            groupId = "order-service-inventory-handler",
            containerFactory = "inventoryFailedListenerContainerFactory"
    )
    public void consume(ConsumerRecord<String, OrderInventoryFailedEvent> record) {
        OrderInventoryFailedEvent event = record.value();
        if (event == null) {
            log.warn("Received null inventory failure event");
            return;
        }

        if (event.getOrderId() == null) {
            log.debug("Received an event on inventory-events topic without orderId (likely a low stock alert). Ignoring.");
            return;
        }

        log.info("Received inventory failure event for orderId={} reason={}", event.getOrderId(), event.getReason());
        try {
            orderUseCase.cancelOrderFromInventory(event.getOrderId(), "Thiếu nguyên liệu trong kho: " + event.getReason());
        } catch (Exception e) {
            log.error("Failed to cancel order id={} from inventory event: {}", event.getOrderId(), e.getMessage(), e);
            // Throw exception to trigger retry
            throw e;
        }
    }
}
