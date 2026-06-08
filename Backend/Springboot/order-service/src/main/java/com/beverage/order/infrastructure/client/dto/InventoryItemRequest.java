package com.beverage.order.infrastructure.client.dto;

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
    private UUID variantId;
    private Integer quantity;
    private List<UUID> toppingIds;
}
