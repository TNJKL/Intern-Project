package com.beverage.product.infrastructure.persistence.mapper;

import com.beverage.product.domain.entity.Topping;
import com.beverage.product.infrastructure.persistence.entity.ToppingEntity;
import org.springframework.stereotype.Component;

@Component
public class ToppingMapper {

    public ToppingEntity toEntity(Topping topping) {
        if (topping == null) return null;
        return ToppingEntity.builder()
                .id(topping.getId())
                .name(topping.getName())
                .price(topping.getPrice())
                .isAvailable(topping.getIsAvailable())
                .displayOrder(topping.getDisplayOrder())
                .createdAt(topping.getCreatedAt())
                .updatedAt(topping.getUpdatedAt())
                .build();
    }

    public Topping toDomain(ToppingEntity entity) {
        if (entity == null) return null;
        return Topping.builder()
                .id(entity.getId())
                .name(entity.getName())
                .price(entity.getPrice())
                .isAvailable(entity.getIsAvailable())
                .displayOrder(entity.getDisplayOrder())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}

