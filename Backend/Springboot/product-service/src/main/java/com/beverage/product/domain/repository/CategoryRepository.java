package com.beverage.product.domain.repository;

import com.beverage.product.domain.entity.Category;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

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

    /**
     * Phân trang + keyword.
     * Public (includeDeleted=false): is_active = true + deletedAt IS NULL.
     * Admin (includeDeleted=true): không lọc.
     */
    Page<Category> pageCategories(String keyword, boolean includeDeleted, Pageable pageable);

    /** Lấy danh sách category active theo danh sách id (dùng cho reorder batch). */
    List<Category> findAllActiveByIds(List<UUID> ids);
}
