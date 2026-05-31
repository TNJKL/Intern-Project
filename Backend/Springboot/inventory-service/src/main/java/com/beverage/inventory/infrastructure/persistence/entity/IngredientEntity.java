package com.beverage.inventory.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.*;

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
public class IngredientEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
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

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
        if (currentStock == null) currentStock = BigDecimal.ZERO;
        if (lowStockThreshold == null) lowStockThreshold = BigDecimal.TEN;
        if (isActive == null) isActive = true;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
