package com.beverage.product.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    private Boolean isAvailable;
    private Boolean isFeatured;
    private Short displayOrder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    /** null = đang hoạt động; có giá trị = đã soft-delete */
    private LocalDateTime deletedAt;
}

