package com.beverage.order.learning.kafka._04_multiple_group_ids;

import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@Profile("learner")
@Slf4j
public class _04_MultipleGroupIds {

    // Notification service - nhận tất cả message
    @KafkaListener(
            topics = "learn.kafka.multi-group",
            groupId = "notification-service-group"
    )
    public void notificationService(ConsumerRecord<String, String> record) {
        log.info("=================================================");
        log.info("  [NOTIFICATION SERVICE]  ");
        log.info("  >>> Đang gửi email/SMS cho khách hàng...");
        log.info("  OrderId : {}", record.key());
        log.info("  Message : {}", record.value());
        log.info("  Offset  : {}", record.offset());
        log.info("  >>> Email/SMS đã gửi!");
        log.info("=================================================");
    }

    // Inventory service - cũng nhận tất cả message
    @KafkaListener(
            topics = "learn.kafka.multi-group",
            groupId = "inventory-service-group"
    )
    public void inventoryService(ConsumerRecord<String, String> record) {
        log.info("=================================================");
        log.info("  [INVENTORY SERVICE]  ");
        log.info("  >>> Đang trừ tồn kho...");
        log.info("  OrderId : {}", record.key());
        log.info("  Message : {}", record.value());
        log.info("  Offset  : {}", record.offset());
        log.info("  >>> Tồn kho đã được cập nhật!");
        log.info("=================================================");
    }
}
