package com.beverage.inventory.infrastructure.event.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Kafka event gửi sang topic "inventory-events" khi nguyên liệu chạm ngưỡng cảnh báo.
 * NestJS notification-service lắng nghe và xử lý:
 *  - LOW          → IN_APP notification cho admin (không gửi email)
 *  - CRITICAL     → IN_APP + Email admin một lần
 *  - OUT_OF_STOCK → IN_APP + Email admin khẩn cấp + product-service ẩn sản phẩm liên quan
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LowStockAlertEvent {

    /** Luôn là "LOW_STOCK_ALERT" — NestJS dùng để route đúng handler */
    @Builder.Default
    private String eventType = "LOW_STOCK_ALERT";

    private UUID ingredientId;

    private String ingredientName;

    private String unit;

    /** Tồn kho hiện tại sau lần deduct gần nhất */
    private BigDecimal currentStock;

    /** Ngưỡng LOW đã cài đặt cho nguyên liệu này */
    private BigDecimal lowStockThreshold;

    /**
     * Ngưỡng CRITICAL tính theo công thức: lowStockThreshold × criticalPct / 100.
     * NestJS dùng để hiển thị thông tin gợi ý cho admin.
     */
    private BigDecimal criticalAbsolute;

    /** % dùng để tính criticalAbsolute (ví dụ: 5 = 5%) */
    private Integer criticalPct;

    /** Mức độ cảnh báo: LOW | CRITICAL | OUT_OF_STOCK */
    private String alertLevel;

    /**
     * Số suất (phần) ước tính còn có thể pha được dựa trên tồn kho hiện tại.
     * Giá trị -1 = không tính được (không có recipe liên quan).
     */
    private Integer estimatedPortions;

    private Instant occurredAt;
}
