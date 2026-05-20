package com.beverage.order.learning.kafka;

import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Profile("learner")
@Slf4j
public class _06_IdempotentConsumer {

    // Set lưu các orderId đã xử lý (in-memory, đơn giản)
    private final Set<String> processedOrderIds = ConcurrentHashMap.newKeySet();

    @KafkaListener(
            topics = "learn.kafka.idempotent",
            groupId = "learn-group-06-idempotent"
    )
    public void consume(ConsumerRecord<String, String> record) {
        String orderId = record.key();  // Dùng key làm orderId

        log.info("=== LESSON 6: IDEMPOTENT CONSUMER ===");
        log.info("Received orderId: {}", orderId);
        log.info("Total processed: {}", processedOrderIds.size());

        // BƯỚC 1: Check đã xử lý chưa?
        if (processedOrderIds.contains(orderId)) {
            log.info(">>> Order {} ĐÃ xử lý trước đó - BỎ QUA (idempotent)", orderId);
            log.info(">>> Đây là cách tránh xử lý trùng!");
            log.info("=====================================");
            return;
        }

        // BƯỚC 2: Xử lý (giả lập)
        log.info(">>> Processing order {}...", orderId);
        log.info(">>> [Thanh toán thành công]");

        // BƯỚC 3: Đánh dấu đã xử lý
        processedOrderIds.add(orderId);

        log.info(">>> Order {} processed successfully", orderId);
        log.info(">>> Processed orders so far: {}", processedOrderIds);
        log.info("=====================================");
    }

    // Helper: xem bao nhiêu order đã xử lý
    public int getProcessedCount() {
        return processedOrderIds.size();
    }
}
