package com.beverage.product.application.mapper;

import com.beverage.product.application.dto.request.CreateProductRequest;
import com.beverage.product.application.dto.request.UpdateProductRequest;
import com.beverage.product.application.dto.response.ProductResponse;
import com.beverage.product.application.dto.response.ProductVariantResponse;
import com.beverage.product.application.dto.response.ToppingResponse;
import com.beverage.product.domain.entity.Product;
import com.beverage.product.domain.entity.ProductVariant;
import com.beverage.product.domain.entity.Topping;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ProductDtoMapper {

    private final ToppingDtoMapper toppingDtoMapper;
    private final ProductVariantDtoMapper productVariantDtoMapper;

    public ProductDtoMapper(ToppingDtoMapper toppingDtoMapper, ProductVariantDtoMapper productVariantDtoMapper) {
        this.toppingDtoMapper = toppingDtoMapper;
        this.productVariantDtoMapper = productVariantDtoMapper;
    }

    public Product toDomainCreate(CreateProductRequest request) {
        if (request == null) {
            return null;
        }
        return Product.builder()
                .id(null)
                .categoryId(request.getCategoryId())
                .name(request.getName())
                .slug(request.getSlug())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .isAvailable(request.getIsAvailable() != null ? request.getIsAvailable() : Boolean.TRUE)
                .isFeatured(request.getIsFeatured() != null ? request.getIsFeatured() : Boolean.FALSE)
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : (short) 0)
                .createdAt(null)
                .updatedAt(null)
                .deletedAt(null)
                .build();
    }

    public Product toDomainUpdate(UpdateProductRequest request) {
        if (request == null) {
            return null;
        }
        return Product.builder()
                .categoryId(request.getCategoryId())
                .name(request.getName())
                .slug(request.getSlug())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .isAvailable(request.getIsAvailable() != null ? request.getIsAvailable() : Boolean.TRUE)
                .isFeatured(request.getIsFeatured() != null ? request.getIsFeatured() : Boolean.FALSE)
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : (short) 0)
                .createdAt(null)
                .updatedAt(null)
                .build();
    }

    public ProductResponse toResponse(Product product, List<Topping> toppings) {
        return toResponse(product, toppings, List.of());
    }

    public ProductResponse toResponse(Product product, List<Topping> toppings, List<ProductVariant> variants) {
        if (product == null) {
            return null;
        }
        List<ToppingResponse> toppingResponses = toppings == null ? null
                : toppings.stream().map(toppingDtoMapper::toResponse).toList();

        List<ProductVariantResponse> variantResponses = variants == null || variants.isEmpty()
                ? List.of()
                : variants.stream().map(productVariantDtoMapper::toResponse).toList();

        return ProductResponse.builder()
                .id(product.getId())
                .categoryId(product.getCategoryId())
                .name(product.getName())
                .slug(product.getSlug())
                .description(product.getDescription())
                .imageUrl(product.getImageUrl())
                .isAvailable(product.getIsAvailable())
                .isFeatured(product.getIsFeatured())
                .displayOrder(product.getDisplayOrder())
                .variants(variantResponses)
                .toppings(toppingResponses)
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .deletedAt(product.getDeletedAt())
                .build();
    }
}
