package com.beverage.order.learning.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationContext;
import org.springframework.kafka.config.KafkaListenerEndpointRegistry;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller để điều khiển Kafka Consumer (thay vì dùng Kafka CLI mỗi lần)
 *
 * Giúp test không cần gõ lệnh, chỉ cần call API:
 * - Bật/tắt consumer
 * - Xem consumer đang chạy không
 * - Xem số message đã xử lý
 *
 * Chạy server ở port khác với order-service chính:
 * VD: --server.port=8085
 */
@RestController
@RequestMapping("/api/learn/kafka")
@RequiredArgsConstructor
@Slf4j
public class LearnerController {

    private final KafkaListenerEndpointRegistry registry;
    private final ApplicationContext ctx;

    // ======================= Lesson 3: Offset Reset =======================
    /**
     * Bật consumer "earliest" - đọc lại message cũ
     * POST /api/learn/kafka/offset/start-earliest
     */
    @PostMapping("/offset/start-earliest")
    public String startEarliest() {
        log.info("=== BẬT consumer EARLIEST ===");
        // Container id format: listener.learn-group-03-earliest
        registry.getListenerContainer("learn-group-03-earliest").start();
        return "✅ Consumer EARLIEST đã bật. Đang đọc lại message cũ...";
    }

    /**
     * Bật consumer "latest" - chỉ đọc message mới
     * POST /api/learn/kafka/offset/start-latest
     */
    @PostMapping("/offset/start-latest")
    public String startLatest() {
        log.info("=== BẬT consumer LATEST ===");
        registry.getListenerContainer("learn-group-03-latest").start();
        return "✅ Consumer LATEST đã bật. Chỉ đọc message mới...";
    }

    /**
     * Tắt consumer
     * POST /api/learn/kafka/offset/stop
     */
    @PostMapping("/offset/stop")
    public String stopAll() {
        log.info("=== TẮT tất cả consumer (Lesson 3) ===");
        registry.getListenerContainer("learn-group-03-earliest").stop();
        registry.getListenerContainer("learn-group-03-latest").stop();
        return "✅ Đã tắt consumer. Thử restart để xem lại behavior.";
    }

    // ======================= Lesson 6: Idempotent =======================
    /**
     * Xem số order đã xử lý
     * GET /api/learn/kafka/idempotent/count
     */
    @GetMapping("/idempotent/count")
    public String getIdempotentCount() {
        try {
            var consumer = ctx.getBean(
                    com.beverage.order.learning.kafka._06_IdempotentConsumer.class);
            return "📊 Đã xử lý " + consumer.getProcessedCount() + " orderId unique";
        } catch (Exception e) {
            return "Consumer chưa chạy";
        }
    }

    /**
     * Reset bộ nhớ đã xử lý (để test lại từ đầu)
     * POST /api/learn/kafka/idempotent/reset
     */
    @PostMapping("/idempotent/reset")
    public String resetIdempotent() {
        return "⚠️ Không thể reset trực tiếp. Restart service để reset memory.";
    }

    // ======================= Status =======================
    /**
     * Xem trạng thái tất cả consumer
     * GET /api/learn/kafka/status
     */
    @GetMapping("/status")
    public String status() {
        StringBuilder sb = new StringBuilder();
        sb.append("=== KAFKA LEARNER STATUS ===\n\n");

        registry.getListenerContainers().forEach(container -> {
            sb.append("Listener: ").append(container.getListenerId()).append("\n");
            sb.append("  Status : ").append(container.isRunning() ? "🟢 RUNNING" : "🔴 STOPPED").append("\n");
            sb.append("\n");
        });

        return sb.toString();
    }
}
