package com.beverage.product.infrastructure.persistence.mapper;

import com.beverage.product.domain.entity.ProductTopping;
import com.beverage.product.infrastructure.persistence.entity.ProductToppingEntity;
import org.springframework.stereotype.Component;

@Component
public class ProductToppingMapper {

    public ProductToppingEntity toEntity(ProductTopping productTopping) {
        if (productTopping == null) return null;
        return ProductToppingEntity.builder()
                .id(productTopping.getId())
                .productId(productTopping.getProductId())
                .toppingId(productTopping.getToppingId())
                .build();
    }

    public ProductTopping toDomain(ProductToppingEntity entity) {
        if (entity == null) return null;
        return ProductTopping.builder()
                .id(entity.getId())
                .productId(entity.getProductId())
                .toppingId(entity.getToppingId())
                .build();
    }
}

