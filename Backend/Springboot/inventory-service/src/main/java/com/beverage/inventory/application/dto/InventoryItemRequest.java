package com.beverage.inventory.application.dto;

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
public class InventoryItemRequest {
    private UUID productId;
    private UUID variantId; // Nullable for size variants
    private Integer quantity;
    private List<UUID> toppingIds; // Nullable for custom add-ons
}
