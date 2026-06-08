package com.beverage.inventory.application.dto.response;

import com.beverage.inventory.domain.model.StockAlertLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IngredientResponse {
    private UUID id;
    private String name;
    private String sku;
    private String unit;
    private BigDecimal currentStock;
    private BigDecimal lowStockThreshold;
    private BigDecimal costPerUnit;
    private Boolean isActive;
    private Instant createdAt;
    private Instant updatedAt;

    // ---- Low Stock Alert fields ----
    /** Phần trăm của lowStockThreshold để tính ngưỡng CRITICAL (default 5) */
    private Integer criticalStockThresholdPct;

    /**
     * Ngưỡng CRITICAL tính được: lowStockThreshold × criticalPct / 100.
     * Trường này được tính và gán trong UseCase, không lưu riêng trong DB.
     */
    private BigDecimal criticalAbsolute;

    /** Mức độ cảnh báo hiện tại của nguyên liệu: NORMAL / LOW / CRITICAL / OUT_OF_STOCK */
    private String alertLevel;

    /** Thời điểm alert được gửi gần nhất. NULL = chưa gửi hoặc đã restock. */
    private Instant lowStockAlertSentAt;
}
