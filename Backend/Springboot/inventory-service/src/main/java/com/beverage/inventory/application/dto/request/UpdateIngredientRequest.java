package com.beverage.inventory.application.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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

    /**
     * Phần trăm của lowStockThreshold để xác định ngưỡng CRITICAL.
     * Optional — nếu không truyền thì giữ nguyên giá trị hiện tại.
     */
    @Min(value = 1, message = "Critical threshold phải từ 1%")
    @Max(value = 50, message = "Critical threshold không được vượt quá 50%")
    private Integer criticalStockThresholdPct;
}
