package com.beverage.inventory.application.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateIngredientRequest {

    @NotBlank(message = "Tên nguyên liệu không được để trống")
    private String name;

    @NotBlank(message = "Mã SKU không được để trống")
    private String sku;

    @NotBlank(message = "Đơn vị tính không được để trống")
    private String unit;

    @NotNull(message = "Tồn kho ban đầu không được để trống")
    @DecimalMin(value = "0.0", message = "Tồn kho không được nhỏ hơn 0")
    private BigDecimal currentStock;

    @NotNull(message = "Ngưỡng cảnh báo hết hàng không được để trống")
    @DecimalMin(value = "0.0", message = "Ngưỡng cảnh báo không được nhỏ hơn 0")
    private BigDecimal lowStockThreshold;

    private BigDecimal costPerUnit;

    /**
     * Phần trăm của lowStockThreshold để xác định ngưỡng CRITICAL.
     * VD: 5 → CRITICAL khi tồn kho ≤ lowStockThreshold × 5%.
     * Mặc định 5 nếu không cần tùy chỉnh.
     */
    @Min(value = 1, message = "Critical threshold phải từ 1%")
    @Max(value = 50, message = "Critical threshold không được vượt quá 50%")
    @Builder.Default
    private Integer criticalStockThresholdPct = 5;
}
