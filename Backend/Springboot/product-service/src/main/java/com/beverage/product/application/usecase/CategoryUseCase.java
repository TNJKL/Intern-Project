package com.beverage.product.application.usecase;

import com.beverage.product.application.dto.request.CreateCategoryRequest;
import com.beverage.product.application.dto.request.ReorderItemRequest;
import com.beverage.product.application.dto.request.UpdateCategoryRequest;
import com.beverage.product.application.dto.response.CategoryResponse;
import com.beverage.product.application.mapper.CategoryDtoMapper;
import com.beverage.product.application.service.CatalogSlugService;
import com.beverage.product.domain.entity.Category;
import com.beverage.product.domain.exception.BusinessException;
import com.beverage.product.domain.exception.ResourceNotFoundException;
import com.beverage.product.domain.repository.CategoryRepository;
import com.beverage.product.infrastructure.cache.CatalogCacheKeys;
import com.beverage.product.infrastructure.cache.RedisCacheService;
import com.beverage.product.infrastructure.storage.CatalogImageStorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Predicate;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryUseCase {

    private final CategoryRepository categoryRepository;
    private final CategoryDtoMapper categoryDtoMapper;
    private final RedisCacheService redisCacheService;
    private final CatalogImageStorageService catalogImageStorageService;
    private final CatalogSlugService catalogSlugService;

    public CategoryResponse createCategory(@Valid CreateCategoryRequest request) {
        Category category = categoryDtoMapper.toDomainCreate(request);
        Predicate<String> taken = categoryRepository::existsActiveBySlug;
        category.setSlug(resolveSlugOnCreate(request.getSlug(), request.getName(), taken));
        Category saved = categoryRepository.save(category);
        evictCaches();
        return categoryDtoMapper.toResponse(saved);
    }

    public CategoryResponse updateCategory(UUID id, @Valid UpdateCategoryRequest request) {
        Category existing = categoryRepository.findActiveById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));

        Category updated = categoryDtoMapper.toDomainUpdate(request);
        String newSlug = catalogSlugService.slugify(updated.getSlug());
        updated.setSlug(newSlug);
        if (!newSlug.equals(existing.getSlug()) && categoryRepository.existsActiveBySlugExcludingId(newSlug, id)) {
            throw new BusinessException("Slug đã được danh mục khác sử dụng.", "SLUG_CONFLICT");
        }

        updated.setId(existing.getId());
        updated.setDeletedAt(existing.getDeletedAt());
        updated.setCreatedAt(existing.getCreatedAt());
        if (updated.getImageUrl() == null || updated.getImageUrl().isBlank()) {
            updated.setImageUrl(existing.getImageUrl());
        }

        Category saved = categoryRepository.save(updated);
        catalogImageStorageService.deleteIfChangedQuietly(existing.getImageUrl(), saved.getImageUrl());
        evictCaches();
        return categoryDtoMapper.toResponse(saved);
    }

    public void deleteCategory(UUID id) {
        Category existing = categoryRepository.findActiveById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));
        existing.setDeletedAt(LocalDateTime.now());
        categoryRepository.save(existing);
        evictCaches();
    }

    public void restoreCategory(UUID id) {
        Category existing = categoryRepository.findIncludingDeletedById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));
        if (existing.getDeletedAt() == null) {
            throw new BusinessException("Danh mục chưa nằm trong thùng rác (đang hoạt động).", "NOT_SOFT_DELETED");
        }
        if (categoryRepository.existsActiveBySlug(existing.getSlug())) {
            throw new BusinessException(
                    "Không thể khôi phục: slug \"" + existing.getSlug()
                            + "\" đã được danh mục đang hoạt động sử dụng. Cần đổi slug bản ghi đã xóa trước.",
                    "SLUG_CONFLICT_RESTORE");
        }
        existing.setDeletedAt(null);
        categoryRepository.save(existing);
        evictCaches();
    }

    public CategoryResponse getCategoryById(UUID id) {
        Category category = categoryRepository.findActiveById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));
        return categoryDtoMapper.toResponse(category);
    }

    public CategoryResponse getCategoryBySlug(String rawSlug) {
        String slug = catalogSlugService.slugify(rawSlug);
        Category category = categoryRepository.findActiveBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "slug", slug));
        return categoryDtoMapper.toResponse(category);
    }

    /**
     * Trả về trang danh mục có phân trang + keyword.
     * Không cache list (nhiều tổ hợp page/size/sort/filter → cache không hiệu quả).
     */
    public Page<CategoryResponse> pageCategories(String keyword, boolean includeDeleted, Pageable pageable) {
        return categoryRepository.pageCategories(keyword, includeDeleted, pageable)
                .map(categoryDtoMapper::toResponse);
    }

    @Transactional
    public void reorderCategories(List<ReorderItemRequest> items) {
        if (items == null || items.isEmpty()) {
            throw new BusinessException("Danh sách reorder không được rỗng.", "EMPTY_REORDER");
        }
        Set<Integer> orders = new HashSet<>();
        for (ReorderItemRequest item : items) {
            if (!orders.add(item.getDisplayOrder())) {
                throw new BusinessException(
                        "displayOrder trùng nhau trong danh sách reorder: " + item.getDisplayOrder(),
                        "DUPLICATE_DISPLAY_ORDER");
            }
        }

        List<UUID> ids = items.stream().map(ReorderItemRequest::getId).toList();
        List<Category> categories = categoryRepository.findAllActiveByIds(ids);

        if (categories.size() != ids.size()) {
            Set<UUID> foundIds = categories.stream().map(Category::getId).collect(Collectors.toSet());
            List<UUID> missing = ids.stream().filter(id -> !foundIds.contains(id)).toList();
            throw new ResourceNotFoundException("Category", "ids", missing);
        }

        Map<UUID, Integer> orderMap = items.stream()
                .collect(Collectors.toMap(ReorderItemRequest::getId, ReorderItemRequest::getDisplayOrder));

        for (Category c : categories) {
            c.setDisplayOrder(orderMap.get(c.getId()).shortValue());
            categoryRepository.save(c);
        }

        evictCaches();
    }

    private void evictCaches() {
        redisCacheService.delete(CatalogCacheKeys.CATEGORIES_LIST);
        redisCacheService.deleteByPattern(CatalogCacheKeys.PRODUCT_ALL_PATTERN);
    }

    private String resolveSlugOnCreate(String optionalSlug, String name, Predicate<String> slugTakenInActive) {
        if (optionalSlug != null && !optionalSlug.isBlank()) {
            String normalized = catalogSlugService.slugify(optionalSlug);
            if (slugTakenInActive.test(normalized)) {
                throw new BusinessException("Slug đã tồn tại trên danh mục đang hoạt động.", "SLUG_CONFLICT");
            }
            return normalized;
        }
        return catalogSlugService.allocateUniqueSlug(name, slugTakenInActive);
    }
}
