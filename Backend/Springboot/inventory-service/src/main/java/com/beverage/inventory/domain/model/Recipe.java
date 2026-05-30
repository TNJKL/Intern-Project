package com.beverage.inventory.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Recipe {
    private UUID id;
    private UUID productId;
    private UUID variantId;
    private String productName;
    private Short version;
    private Boolean isActive;
    private Instant createdAt;
    private Instant updatedAt;
}
