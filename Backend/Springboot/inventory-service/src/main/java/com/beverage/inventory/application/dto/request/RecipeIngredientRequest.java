package com.beverage.inventory.application.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecipeIngredientRequest {

    @NotNull(message = "ID nguyên liệu không được để trống")
    private UUID ingredientId;

    @NotNull(message = "Định lượng nguyên liệu không được để trống")
    @DecimalMin(value = "0.001", message = "Định lượng nguyên liệu phải lớn hơn 0")
    private BigDecimal quantity;
}
