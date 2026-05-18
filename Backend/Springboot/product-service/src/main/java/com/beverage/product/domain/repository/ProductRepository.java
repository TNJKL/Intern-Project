package com.beverage.product.domain.repository;

import com.beverage.product.domain.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductRepository {

    Product save(Product product);

    Optional<Product> findActiveById(UUID id);

    Optional<Product> findIncludingDeletedById(UUID id);

    Optional<Product> findActiveBySlug(String slug);

    boolean existsActiveBySlug(String slug);

    boolean existsActiveBySlugExcludingId(String slug, UUID excludeId);

    List<Product> findAll();

    /**
     * @param categoryId optional filter
     * @param includeDeleted nếu true: gồm cả đã xóa mềm; nếu false: chỉ sản phẩm + danh mục đều chưa xóa mềm
     */
    List<Product> listCatalog(UUID categoryId, boolean includeDeleted);

    /**
     * Phân trang + filter linh hoạt.
     * Public (includeDeleted=false): product.deletedAt IS NULL + category.deletedAt IS NULL.
     * Admin (includeDeleted=true): không lọc deletedAt.
     */
    Page<Product> pageCatalog(UUID categoryId, Boolean isAvailable, Boolean isFeatured,
                               String keyword, boolean includeDeleted, Pageable pageable);

    /** Lấy danh sách product active theo danh sách id (dùng cho reorder batch). */
    List<Product> findAllActiveByIds(List<UUID> ids);
}
