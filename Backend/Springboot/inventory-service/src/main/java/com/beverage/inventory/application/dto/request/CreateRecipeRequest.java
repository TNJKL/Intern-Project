package com.beverage.inventory.application.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateRecipeRequest {

    @NotNull(message = "ID sản phẩm không được để trống")
    private UUID productId;

    private UUID variantId; // Nullable for general/default recipes

    private Short version;

    @NotEmpty(message = "Danh sách nguyên liệu trong công thức không được để trống")
    @Valid
    private List<RecipeIngredientRequest> ingredients;
}
