package com.beverage.dashboard.infrastructure.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IngredientAlertDTO {
    private String name;
    private String sku;
    private BigDecimal currentStock;
    private BigDecimal lowStockThreshold;
    private String unit;
    private String level;
}
