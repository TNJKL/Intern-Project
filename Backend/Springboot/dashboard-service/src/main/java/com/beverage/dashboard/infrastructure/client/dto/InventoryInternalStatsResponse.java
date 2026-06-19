package com.beverage.dashboard.infrastructure.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryInternalStatsResponse {
    private Long lowStockCount;
    private Long criticalStockCount;
    private List<IngredientAlertDTO> alertIngredients;
}
