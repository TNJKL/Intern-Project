package com.beverage.inventory.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.domain.Persistable;
import com.beverage.inventory.domain.model.StockAlertLevel;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ingredients")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IngredientEntity implements Persistable<UUID> {

    @Id
    private UUID id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(unique = true, length = 50)
    private String sku;

    @Column(nullable = false, length = 20)
    private String unit;

    @Column(name = "current_stock", nullable = false, precision = 12, scale = 3)
    private BigDecimal currentStock;

    @Column(name = "low_stock_threshold", nullable = false, precision = 12, scale = 3)
    private BigDecimal lowStockThreshold;

    @Column(name = "cost_per_unit", precision = 12, scale = 2)
    private BigDecimal costPerUnit;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    // ----------------------------------------------------------------
    // Low Stock Alert fields (Migration: 10-low-stock-alert.sql)
    // ----------------------------------------------------------------

    /**
     * Phần trăm của lowStockThreshold để xác định ngưỡng CRITICAL.
     * VD: 5 → CRITICAL khi currentStock <= lowStockThreshold × 5/100
     * Mặc định 5 (= 5%). Admin có thể tùy chỉnh per-ingredient.
     */
    @Column(name = "critical_stock_threshold_pct", nullable = false)
    @Builder.Default
    private Integer criticalStockThresholdPct = 5;

    /**
     * Thời điểm đã gửi low stock alert lần gần nhất.
     * NULL = chưa gửi alert, hoặc đã restock trở lại (reset về NULL).
     * Có giá trị = đã gửi, KHÔNG gửi lại cho đến khi admin nhập kho.
     */
    @Column(name = "low_stock_alert_sent_at")
    private Instant lowStockAlertSentAt;

    /** Mức độ cảnh báo của lần gửi alert gần nhất (NULL = chưa gửi hoặc đã restock) */
    @Enumerated(EnumType.STRING)
    @Column(name = "last_alert_level")
    private StockAlertLevel lastAlertLevel;

    @Transient
    @Builder.Default
    private boolean isNew = true;

    @Override
    public boolean isNew() {
        return isNew;
    }

    @PostPersist
    @PostLoad
    protected void markNotNew() {
        this.isNew = false;
    }

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
        if (currentStock == null) currentStock = BigDecimal.ZERO;
        if (lowStockThreshold == null) lowStockThreshold = BigDecimal.TEN;
        if (isActive == null) isActive = true;
        if (criticalStockThresholdPct == null) criticalStockThresholdPct = 5;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
