package com.beverage.product.domain.repository;

import com.beverage.product.domain.entity.Category;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CategoryRepository {

    Category save(Category category);

    Optional<Category> findActiveById(UUID id);

    Optional<Category> findIncludingDeletedById(UUID id);

    Optional<Category> findActiveBySlug(String slug);

    boolean existsActiveBySlug(String slug);

    boolean existsActiveBySlugExcludingId(String slug, UUID excludeId);

    /** Toàn bộ bản ghi (công cụ nội bộ / consistency). */
    List<Category> findAll();

    /** Danh sách catalog: {@code false} = chỉ bản ghi đang hoạt động (is_active và chưa xóa mềm). */
    List<Category> listCatalog(boolean includeDeleted);
}
