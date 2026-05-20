package com.beverage.order.learning.kafka._07_deserialization_error;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * LESSON 7: Deserialization Error - Message sai format
 *
 * Mục tiêu:
 * - Hiểu Kafka không đọc được message sai format thì sao?
 * - ErrorHandlingDeserializer - không crash toàn bộ consumer
 * - Xử lý message lỗi riêng
 *
 * Vấn đề:
 * - Nếu message không parse được JSON → Kafka throw Exception
 * - Mặc định: Consumer DỪNG HẲN (vì không biết làm gì)
 * - Hậu quả: Tất cả message phía sau cũng không được xử lý
 *
 * Giải pháp: ErrorHandlingDeserializer
 * - Message sai format → ghi log lỗi → BỎ QUA message đó
 * - Các message khác vẫn xử lý bình thường
 *
 * Cách test:
 * 1. Gửi message đúng format:
 *    > {"orderId": "123", "status": "CONFIRMED"}
 *    → Log: "Valid message: ..."
 *
 * 2. Gửi message SAI format (bằng Kafka CLI):
 *    kafka-console-producer --bootstrap-server localhost:9092 --topic learn.kafka.deserialize
 *    > THIS IS NOT JSON!!!
 *    → Log: "DESERIALIZATION ERROR - cannot parse message: THIS IS NOT JSON!!!"
 *    → Message bị skip, consumer KHÔNG CRASH
 *
 * 3. Gửi tiếp message đúng:
 *    > {"orderId": "456", "status": "PREPARING"}
 *    → Vẫn xử lý được bình thường!
 *
 * Khác với Lesson 5 (Retry):
 * - Lesson 5: Xử lý được nhưng logic lỗi → retry rồi DLQ
 * - Lesson 7: KHÔNG parse được JSON → skip + log
 */
@Component
@Profile("learner")
@Slf4j
public class _07_DeserializationError {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @KafkaListener(
            topics = "learn.kafka.deserialize",
            groupId = "learn-group-07-deserialize"
    )
    public void consume(ConsumerRecord<String, String> record) {
        String rawValue = record.value();

        log.info("=== LESSON 7: DESERIALIZATION ===");
        log.info("Raw message: {}", rawValue);

        try {
            // Thử parse JSON
            objectMapper.readTree(rawValue);
            log.info(">>> Message parse THÀNH CÔNG");
            log.info(">>> Xử lý order bình thường");
            log.info("================================");
        } catch (Exception e) {
            // JSON parse lỗi → KHÔNG crash consumer
            log.error("!!! DESERIALIZATION ERROR - cannot parse message: {}", rawValue);
            log.error("!!! Error: {}", e.getMessage());
            log.info(">>> Message bị SKIP, consumer tiếp tục hoạt động");
            log.info("================================");
            // KHÔNG throw exception → Kafka coi như xử lý thành công
        }
    }
}
