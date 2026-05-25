package com.beverage.order.learning.kafka._03_offset_reset;

import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@Profile("learner")
@Slf4j
public class _03_OffsetReset {

    // Consumer dùng EARLIEST - đọc lại message cũ khi restart
    @KafkaListener(
            id = "earliestListener",
            topics = "learn.kafka.offset.earliest",
            groupId = "learn-group-03-earliest-v3",
            autoStartup = "false",              // Tắt auto start - bật bằng tay
            properties = {
                    //"spring.kafka.consumer.auto-offset-reset=earliest"
                    "auto.offset.reset=earliest"
            }
    )
    public void consumeEarliest(ConsumerRecord<String, String> record) {
        log.info("=== EARLIEST ===");
        log.info("Partition: {}", record.partition());
        log.info("Offset   : {}", record.offset());
        log.info("Value    : {}", record.value());
        log.info(">>> Doc MESSAGE cu (earliest)");
        log.info("==============");
    }

    // Consumer dùng LATEST - chỉ đọc message mới
    @KafkaListener(
            id = "latestListener",
            topics = "learn.kafka.offset.latest",
            groupId = "learn-group-03-latest-v3",
            autoStartup = "false",
            properties = {
                //     "spring.kafka.consumer.auto-offset-reset=latest"
                "auto.offset.reset=latest"
            }
    )
    public void consumeLatest(ConsumerRecord<String, String> record) {
        log.info("=== LATEST ===");
        log.info("Partition: {}", record.partition());
        log.info("Offset   : {}", record.offset());
        log.info("Value    : {}", record.value());
        log.info(">>> CHI MESSAGE MOI (latest)");
        log.info("==============");
    }
}
