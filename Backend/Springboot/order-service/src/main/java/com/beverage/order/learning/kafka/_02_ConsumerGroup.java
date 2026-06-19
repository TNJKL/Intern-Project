package com.beverage.order.learning.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@Profile("learner")
@Slf4j
public class _02_ConsumerGroup {

    @KafkaListener(topics = "learn.kafka.group", groupId = "learn-group-02", // CÙNG group với instance khác
            properties = {
                    "spring.kafka.listener.concurrency=1" // mỗi consumer chỉ đọc 1 partition
            })
    public void consume(ConsumerRecord<String, String> record) {
        // Lấy tên instance để phân biệt
        String instanceId = System.getProperty("spring.application.name", "unknown");

        log.info("=== LESSON 2: CONSUMER GROUP ===");
        log.info("Instance : {} (PID={})", instanceId, ProcessHandle.current().pid());
        log.info("Partition: {}", record.partition());
        log.info("Offset   : {}", record.offset());
        log.info("Value    : {}", record.value());
        log.info(">>> Instance này dang xy ly partition {}", record.partition());
        log.info("=================================");
    }
}
