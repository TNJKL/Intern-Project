package com.beverage.order.learning.kafka._05_retry_dlq;

import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * LESSON 5: Retry và Dead Letter Queue (DLQ)
 *
 * Mục tiêu:
 * - Hiểu Kafka retry bao nhiêu lần khi xử lý lỗi
 * - Sau khi retry hết → message đi đâu?
 * - DLQ là gì và tại sao quan trọng
 *
 * Cách test:
 * 1. Gửi message hợp lệ: {"type": "ok", "data": "hello"}
 *    → Log ra: "Processed OK"
 *
 * 2. Gửi message cố tình lỗi: {"type": "error", "data": "fail"}
 *    → Log ra: retry 3 lần → cuối cùng đẩy sang DLQ
 *
 * 3. Kiểm tra topic "learn.kafka.retry.DLT":
 *    kafka-console-consumer --bootstrap-server localhost:9092 --topic learn.kafka.retry.DLT
 *
 * Flow thực tế:
 * Message → Consumer xử lý → LỖI → Retry 3 lần → Vẫn lỗi → Gửi sang DLQ
 *                              ↓
 *                    Log: "Attempt 1 failed, retrying..."
 *                    Log: "Attempt 2 failed, retrying..."
 *                    Log: "Attempt 3 failed, retrying..."
 *                    Log: "Moved to DLQ after 3 retries"
 */
@Component
@Profile("learner")
@Slf4j
public class _05_RetryAndDLQ {

    @KafkaListener(
            topics = "learn.kafka.retry",
            groupId = "learn-group-05-retry",
            properties = {
                    "spring.json.value.type.method: java.lang.String"
            }
    )
    public void consume(ConsumerRecord<String, String> record) throws Exception {
        String value = record.value();

        log.info("=== LESSON 5: RETRY & DLQ ===");
        log.info("Received: {}", value);

        // Parse đơn giản
        if (value.contains("\"type\":\"error\"")) {
            log.warn(">>> Xy ly loi - se retry...");
            throw new RuntimeException("Simulated processing failure!");
        }

        log.info(">>> Xu ly  OK - khong retry");
        log.info("===========================");
    }
}
