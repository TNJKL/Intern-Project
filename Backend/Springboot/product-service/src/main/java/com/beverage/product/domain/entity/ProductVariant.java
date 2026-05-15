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
public class ProductVariant {
    private UUID id;
    private UUID productId;
    /** null = một mức giá duy nhất (vd bánh) */
    private String sizeLabel;
    private BigDecimal price;
    private Boolean isAvailable;
    private Short displayOrder;
    private LocalDateTime deletedAt;
}
