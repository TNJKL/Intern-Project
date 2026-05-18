package com.beverage.product.application.mapper;

import com.beverage.product.application.dto.response.ProductVariantResponse;
import com.beverage.product.domain.entity.ProductVariant;
import org.springframework.stereotype.Component;

@Component
public class ProductVariantDtoMapper {

    public ProductVariantResponse toResponse(ProductVariant v) {
        if (v == null) {
            return null;
        }
        return ProductVariantResponse.builder()
                .id(v.getId())
                .sizeLabel(v.getSizeLabel())
                .price(v.getPrice())
                .isAvailable(v.getIsAvailable())
                .displayOrder(v.getDisplayOrder())
                .build();
    }
}
