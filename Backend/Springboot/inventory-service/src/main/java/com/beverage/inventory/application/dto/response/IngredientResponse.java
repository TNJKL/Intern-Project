package com.beverage.inventory.application.dto.response;

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
}
