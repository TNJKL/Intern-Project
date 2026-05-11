package com.beverage.product.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Product {
    private UUID id;
    private UUID categoryId;
    private String name;
    private String slug;
    private String description;
    private String imageUrl;
    private BigDecimal price;
    private Boolean isAvailable;
    private Boolean isFeatured;
    private Short displayOrder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

