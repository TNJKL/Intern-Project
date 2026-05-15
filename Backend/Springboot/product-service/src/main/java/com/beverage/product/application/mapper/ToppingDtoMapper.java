package com.beverage.product.application.mapper;

import com.beverage.product.application.dto.request.CreateToppingRequest;
import com.beverage.product.application.dto.request.UpdateToppingRequest;
import com.beverage.product.application.dto.response.ToppingResponse;
import com.beverage.product.domain.entity.Topping;
import org.springframework.stereotype.Component;

@Component
public class ToppingDtoMapper {

    public Topping toDomainCreate(CreateToppingRequest request) {
        if (request == null) return null;
        return Topping.builder()
                .id(null)
                .name(request.getName())
                .imageUrl(request.getImageUrl())
                .price(request.getPrice())
                .isAvailable(request.getIsAvailable() != null ? request.getIsAvailable() : Boolean.TRUE)
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : (short) 0)
                .createdAt(null)
                .updatedAt(null)
                .deletedAt(null)
                .build();
    }

    public Topping toDomainUpdate(UpdateToppingRequest request) {
        if (request == null) return null;
        return Topping.builder()
                .name(request.getName())
                .imageUrl(request.getImageUrl())
                .price(request.getPrice())
                .isAvailable(request.getIsAvailable() != null ? request.getIsAvailable() : Boolean.TRUE)
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : (short) 0)
                .createdAt(null)
                .updatedAt(null)
                .build();
    }

    public ToppingResponse toResponse(Topping topping) {
        if (topping == null) return null;
        return ToppingResponse.builder()
                .id(topping.getId())
                .name(topping.getName())
                .imageUrl(topping.getImageUrl())
                .price(topping.getPrice())
                .isAvailable(topping.getIsAvailable())
                .displayOrder(topping.getDisplayOrder())
                .createdAt(topping.getCreatedAt())
                .updatedAt(topping.getUpdatedAt())
                .deletedAt(topping.getDeletedAt())
                .build();
    }
}

