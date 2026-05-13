package com.beverage.product.domain.repository;

import com.beverage.product.domain.entity.Product;

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
}
