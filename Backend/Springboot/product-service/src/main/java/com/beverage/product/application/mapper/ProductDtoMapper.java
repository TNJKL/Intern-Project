package com.beverage.product.application.mapper;

import com.beverage.product.application.dto.request.CreateProductRequest;
import com.beverage.product.application.dto.request.UpdateProductRequest;
import com.beverage.product.application.dto.response.ProductResponse;
import com.beverage.product.application.dto.response.ToppingResponse;
import com.beverage.product.domain.entity.Product;
import com.beverage.product.domain.entity.Topping;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
public class ProductDtoMapper {

    private final ToppingDtoMapper toppingDtoMapper;

    public ProductDtoMapper(ToppingDtoMapper toppingDtoMapper) {
        this.toppingDtoMapper = toppingDtoMapper;
    }

    public Product toDomainCreate(CreateProductRequest request) {
        if (request == null) return null;
        return Product.builder()
                .id(null)
                .categoryId(request.getCategoryId())
                .name(request.getName())
                .slug(request.getSlug())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .price(request.getPrice())
                .isAvailable(request.getIsAvailable() != null ? request.getIsAvailable() : Boolean.TRUE)
                .isFeatured(request.getIsFeatured() != null ? request.getIsFeatured() : Boolean.FALSE)
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : (short) 0)
                .createdAt(null)
                .updatedAt(null)
                .build();
    }

    public Product toDomainUpdate(UpdateProductRequest request) {
        if (request == null) return null;
        return Product.builder()
                .categoryId(request.getCategoryId())
                .name(request.getName())
                .slug(request.getSlug())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .price(request.getPrice())
                .isAvailable(request.getIsAvailable() != null ? request.getIsAvailable() : Boolean.TRUE)
                .isFeatured(request.getIsFeatured() != null ? request.getIsFeatured() : Boolean.FALSE)
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : (short) 0)
                .createdAt(null)
                .updatedAt(null)
                .build();
    }

    public ProductResponse toResponse(Product product, List<Topping> toppings) {
        if (product == null) return null;
        List<ToppingResponse> toppingResponses = toppings == null ? null
                : toppings.stream().map(toppingDtoMapper::toResponse).toList();

        return ProductResponse.builder()
                .id(product.getId())
                .categoryId(product.getCategoryId())
                .name(product.getName())
                .slug(product.getSlug())
                .description(product.getDescription())
                .imageUrl(product.getImageUrl())
                .price(product.getPrice())
                .isAvailable(product.getIsAvailable())
                .isFeatured(product.getIsFeatured())
                .displayOrder(product.getDisplayOrder())
                .toppings(toppingResponses)
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }
}

