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
public class Category {
    private UUID id;
    private String name;
    private String slug;
    private String imageUrl;
    private Short displayOrder;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    /** null = đang hoạt động; có giá trị = đã soft-delete */
    private LocalDateTime deletedAt;
}

