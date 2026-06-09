package com.beverage.inventory.infrastructure.scheduler;

import com.beverage.inventory.infrastructure.persistence.repository.ProcessedEventJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;

/**
2. Dọn dẹp processed_events cũ định kỳ để giải phóng dung lượng DB.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ProcessedEventCleanupScheduler {

    private final ProcessedEventJpaRepository processedEventJpaRepository;

    @Value("${app.scheduler.cleanup.retention-days:30}")
    private int retentionDays;

    /**
     * Chạy tác vụ dọn dẹp định kỳ dựa trên biểu thức cron cấu hình.
     * Mặc định chạy vào lúc 2 giờ sáng mỗi ngày.
     */
    @Scheduled(cron = "${app.scheduler.cleanup.cron:0 0 2 * * ?}")
    @Transactional
    public void cleanupOldEvents() {
        log.info("Bắt đầu dọn dẹp các processed_events cũ hơn {} ngày...", retentionDays);
        try {
            Instant cutoffTime = Instant.now().minus(Duration.ofDays(retentionDays));
            int deletedCount = processedEventJpaRepository.deleteOldEvents(cutoffTime);
            log.info("Dọn dẹp thành công! Đã xóa {} bản ghi processed_events được xử lý trước {}", deletedCount, cutoffTime);
        } catch (Exception e) {
            log.error("Lỗi xảy ra trong quá trình dọn dẹp processed_events: {}", e.getMessage(), e);
        }
    }
}
