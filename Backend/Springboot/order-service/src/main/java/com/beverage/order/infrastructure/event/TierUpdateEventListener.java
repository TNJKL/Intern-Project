package com.beverage.order.infrastructure.event;

import com.beverage.order.application.event.OrderCompletedEvent;
import com.beverage.order.application.event.OrderEventWrapper;
import com.beverage.order.application.service.CustomerTierService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class TierUpdateEventListener {

    private final CustomerTierService customerTierService;

    @KafkaListener(
            topics = OrderTopics.ORDER_EVENTS,
            groupId = "order-service-tier-updater",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void handleEvent(ConsumerRecord<String, OrderEventWrapper> record) {
        OrderEventWrapper wrapper = record.value();
        if (wrapper == null) {
            return;
        }

        String eventType = wrapper.getEventType();
        if (!OrderCompletedEvent.EVENT_TYPE.equals(eventType)) {
            return;
        }

        try {
            OrderCompletedEvent event = (OrderCompletedEvent) wrapper;
            if (event.getUserId() != null) {
                customerTierService.onOrderCompleted(
                        event.getUserId(),
                        event.getTotalAmount(),
                        event.getUserEmail(),
                        event.getUserName()
                );
                log.info("Updated tier for user {} after order {} completed",
                        event.getUserId(), event.getOrderCode());
            }
        } catch (Exception e) {
            log.error("Failed to process tier update for event: {}", wrapper, e);
        }
    }
}
