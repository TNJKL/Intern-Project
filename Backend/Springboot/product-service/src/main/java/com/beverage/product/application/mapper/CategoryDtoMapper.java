package com.beverage.product.application.mapper;

import com.beverage.product.application.dto.request.CreateCategoryRequest;
import com.beverage.product.application.dto.request.UpdateCategoryRequest;
import com.beverage.product.application.dto.response.CategoryResponse;
import com.beverage.product.domain.entity.Category;
import org.springframework.stereotype.Component;

@Component
public class CategoryDtoMapper {

    public Category toDomainCreate(CreateCategoryRequest request) {
        if (request == null) return null;
        return Category.builder()
                .id(null)
                .name(request.getName())
                .slug(request.getSlug())
                .imageUrl(request.getImageUrl())
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : (short) 0)
                .isActive(request.getIsActive() != null ? request.getIsActive() : Boolean.TRUE)
                .createdAt(null)
                .updatedAt(null)
                .deletedAt(null)
                .build();
    }

    public Category toDomainUpdate(UpdateCategoryRequest request) {
        if (request == null) return null;
        return Category.builder()
                .name(request.getName())
                .slug(request.getSlug())
                .imageUrl(request.getImageUrl())
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : (short) 0)
                .isActive(request.getIsActive() != null ? request.getIsActive() : Boolean.TRUE)
                .createdAt(null)
                .updatedAt(null)
                .build();
    }

    public CategoryResponse toResponse(Category category) {
        if (category == null) return null;
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .slug(category.getSlug())
                .imageUrl(category.getImageUrl())
                .displayOrder(category.getDisplayOrder())
                .isActive(category.getIsActive())
                .createdAt(category.getCreatedAt())
                .updatedAt(category.getUpdatedAt())
                .deletedAt(category.getDeletedAt())
                .build();
    }
}

