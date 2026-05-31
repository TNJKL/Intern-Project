package com.beverage.inventory.application.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecipeResponse {
    private UUID id;
    private UUID productId;
    private UUID variantId;
    private String productName;
    private Short version;
    private Boolean isActive;
    private List<RecipeIngredientResponse> ingredients;
    private Instant createdAt;
    private Instant updatedAt;
}
