package com.beverage.inventory.presentation.controller;

import com.beverage.inventory.application.dto.response.IngredientAlertDTO;
import com.beverage.inventory.application.dto.response.InventoryInternalStatsResponse;
import com.beverage.inventory.common.ApiResponse;
import com.beverage.inventory.infrastructure.persistence.entity.IngredientEntity;
import com.beverage.inventory.infrastructure.persistence.repository.IngredientJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/v1/internal/inventory")
@RequiredArgsConstructor
@Slf4j
public class InternalInventoryController {

    private final IngredientJpaRepository ingredientJpaRepository;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<InventoryInternalStatsResponse>> getStats() {
        log.info("Internal request to fetch inventory stats");

        List<IngredientEntity> lowStockEntities = ingredientJpaRepository.findAllLowStockIngredients();

        long lowStockCount = 0;
        long criticalStockCount = 0;
        List<IngredientAlertDTO> alertIngredients = new ArrayList<>();

        for (IngredientEntity entity : lowStockEntities) {
            BigDecimal current = entity.getCurrentStock();
            BigDecimal threshold = entity.getLowStockThreshold();
            int criticalPct = entity.getCriticalStockThresholdPct() != null ? entity.getCriticalStockThresholdPct() : 5;

            // critical threshold = lowStockThreshold * criticalPct / 100
            BigDecimal criticalThreshold = threshold.multiply(new BigDecimal(criticalPct)).divide(new BigDecimal(100));

            String level;
            if (current.compareTo(criticalThreshold) <= 0) {
                criticalStockCount++;
                level = "CRITICAL";
            } else {
                lowStockCount++;
                level = "WARNING";
            }

            // Add to detail list (limit detail to maximum of 20 items to keep payload small)
            if (alertIngredients.size() < 20) {
                alertIngredients.add(IngredientAlertDTO.builder()
                        .name(entity.getName())
                        .sku(entity.getSku())
                        .currentStock(current)
                        .lowStockThreshold(threshold)
                        .unit(entity.getUnit())
                        .level(level)
                        .build());
            }
        }

        InventoryInternalStatsResponse responseData = InventoryInternalStatsResponse.builder()
                .lowStockCount(lowStockCount)
                .criticalStockCount(criticalStockCount)
                .alertIngredients(alertIngredients)
                .build();

        return ResponseEntity.ok(ApiResponse.success(responseData, "Lay du lieu thong ke kho hang thanh cong"));
    }
}
