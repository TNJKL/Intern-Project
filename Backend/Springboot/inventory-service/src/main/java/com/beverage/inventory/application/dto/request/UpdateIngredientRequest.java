package com.beverage.inventory.application.dto.request;

import jakarta.validation.constraints.DecimalMin;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateIngredientRequest {

    private String name;
    private String sku;
    private String unit;

    @DecimalMin(value = "0.0", message = "Ngưỡng cảnh báo không được nhỏ hơn 0")
    private BigDecimal lowStockThreshold;

    @DecimalMin(value = "0.0", message = "Giá vốn không được nhỏ hơn 0")
    private BigDecimal costPerUnit;
}
