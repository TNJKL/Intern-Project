package com.beverage.product.application.usecase;

import com.beverage.product.application.dto.request.CreateCategoryRequest;
import com.beverage.product.application.dto.request.UpdateCategoryRequest;
import com.beverage.product.application.dto.response.CategoryResponse;
import com.beverage.product.application.mapper.CategoryDtoMapper;
import com.beverage.product.domain.entity.Category;
import com.beverage.product.domain.exception.ResourceNotFoundException;
import com.beverage.product.domain.repository.CategoryRepository;
import com.beverage.product.infrastructure.cache.RedisCacheService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.type.TypeReference;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CategoryUseCase {

    private static final String CACHE_CATEGORIES_KEY = "cache:categories";

    private final CategoryRepository categoryRepository;
    private final CategoryDtoMapper categoryDtoMapper;
    private final RedisCacheService redisCacheService;

    public CategoryResponse createCategory(@Valid CreateCategoryRequest request) {
        Category category = categoryDtoMapper.toDomainCreate(request);
        Category saved = categoryRepository.save(category);
        redisCacheService.delete(CACHE_CATEGORIES_KEY);
        redisCacheService.deleteByPattern("cache:product:*");
        return categoryDtoMapper.toResponse(saved);
    }

    public CategoryResponse updateCategory(UUID id, @Valid UpdateCategoryRequest request) {
        Category existing = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));

        Category updated = categoryDtoMapper.toDomainUpdate(request);
        updated.setId(existing.getId());

        Category saved = categoryRepository.save(updated);
        redisCacheService.delete(CACHE_CATEGORIES_KEY);
        redisCacheService.deleteByPattern("cache:product:*");
        return categoryDtoMapper.toResponse(saved);
    }

    public void deleteCategory(UUID id) {
        if (categoryRepository.findById(id).isEmpty()) {
            throw new ResourceNotFoundException("Category", "id", id);
        }
        categoryRepository.deleteById(id);
        redisCacheService.delete(CACHE_CATEGORIES_KEY);
        redisCacheService.deleteByPattern("cache:product:*");
    }

    public CategoryResponse getCategoryById(UUID id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));
        return categoryDtoMapper.toResponse(category);
    }

    public java.util.List<CategoryResponse> listCategoriesActive() {
        TypeReference<java.util.List<CategoryResponse>> typeRef = new TypeReference<>() {};
        java.util.List<CategoryResponse> cached = redisCacheService.get(CACHE_CATEGORIES_KEY, typeRef);
        if (cached != null) {
            return cached;
        }

        java.util.List<CategoryResponse> response = categoryRepository.findAllActive().stream()
                .map(categoryDtoMapper::toResponse)
                .toList();
        redisCacheService.set(CACHE_CATEGORIES_KEY, response);
        return response;
    }
}

