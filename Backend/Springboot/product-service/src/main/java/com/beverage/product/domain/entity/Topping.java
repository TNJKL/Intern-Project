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
public class Topping {
    private UUID id;
    private String name;
    /** URL ảnh (S3/CDN hoặc ngoài); optional */
    private String imageUrl;
    private BigDecimal price;
    private Boolean isAvailable;
    private Short displayOrder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    /** null = đang hoạt động; có giá trị = đã soft-delete */
    private LocalDateTime deletedAt;
}

