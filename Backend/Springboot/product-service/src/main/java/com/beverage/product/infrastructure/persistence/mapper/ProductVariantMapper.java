package com.beverage.product.infrastructure.persistence.mapper;

import com.beverage.product.domain.entity.ProductVariant;
import com.beverage.product.infrastructure.persistence.entity.ProductVariantEntity;
import org.springframework.stereotype.Component;

@Component
public class ProductVariantMapper {

    public ProductVariantEntity toEntity(ProductVariant v) {
        if (v == null) {
            return null;
        }
        return ProductVariantEntity.builder()
                .id(v.getId())
                .productId(v.getProductId())
                .sizeLabel(v.getSizeLabel())
                .price(v.getPrice())
                .isAvailable(v.getIsAvailable() != null ? v.getIsAvailable() : Boolean.TRUE)
                .displayOrder(v.getDisplayOrder() != null ? v.getDisplayOrder() : (short) 0)
                .deletedAt(v.getDeletedAt())
                .build();
    }

    public ProductVariant toDomain(ProductVariantEntity e) {
        if (e == null) {
            return null;
        }
        return ProductVariant.builder()
                .id(e.getId())
                .productId(e.getProductId())
                .sizeLabel(e.getSizeLabel())
                .price(e.getPrice())
                .isAvailable(e.getIsAvailable())
                .displayOrder(e.getDisplayOrder())
                .deletedAt(e.getDeletedAt())
                .build();
    }
}
