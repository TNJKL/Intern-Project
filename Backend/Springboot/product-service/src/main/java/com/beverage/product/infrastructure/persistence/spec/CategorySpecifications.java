package com.beverage.product.infrastructure.persistence.spec;

import com.beverage.product.infrastructure.persistence.entity.CategoryEntity;
import org.springframework.data.jpa.domain.Specification;

/** Các Specification tĩnh để ghép filter cho CategoryEntity. */
public final class CategorySpecifications {

    private CategorySpecifications() {}

    public static Specification<CategoryEntity> notDeleted() {
        return (root, query, cb) -> cb.isNull(root.get("deletedAt"));
    }

    public static Specification<CategoryEntity> isActive() {
        return (root, query, cb) -> cb.isTrue(root.get("isActive"));
    }

    /** Public catalog: chưa xóa mềm + đang kích hoạt. */
    public static Specification<CategoryEntity> publicCatalogBase() {
        return notDeleted().and(isActive());
    }

    /** Tìm kiếm trên tên (case-insensitive). */
    public static Specification<CategoryEntity> withKeyword(String keyword) {
        if (keyword == null || keyword.isBlank()) return Specification.where(null);
        String pattern = "%" + keyword.toLowerCase() + "%";
        return (root, query, cb) -> cb.like(cb.lower(root.get("name")), pattern);
    }
}
