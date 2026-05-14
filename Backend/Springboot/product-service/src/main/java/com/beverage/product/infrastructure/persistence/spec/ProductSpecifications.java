package com.beverage.product.infrastructure.persistence.spec;

import com.beverage.product.infrastructure.persistence.entity.CategoryEntity;
import com.beverage.product.infrastructure.persistence.entity.ProductEntity;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;

/** Các Specification tĩnh để ghép filter cho ProductEntity. */
public final class ProductSpecifications {

    private ProductSpecifications() {}

    /** product.deletedAt IS NULL */
    public static Specification<ProductEntity> notDeleted() {
        return (root, query, cb) -> cb.isNull(root.get("deletedAt"));
    }

    /**
     * Subquery đảm bảo category tồn tại và chưa bị xóa mềm.
     * ProductEntity không có @ManyToOne tới CategoryEntity, nên dùng subquery EXISTS.
     */
    private static Specification<ProductEntity> categoryActive() {
        return (root, query, cb) -> {
            Subquery<UUID> catSub = query.subquery(UUID.class);
            var catRoot = catSub.from(CategoryEntity.class);
            catSub.select(catRoot.get("id"))
                    .where(cb.and(
                            cb.equal(catRoot.get("id"), root.get("categoryId")),
                            cb.isNull(catRoot.get("deletedAt"))
                    ));
            return cb.exists(catSub);
        };
    }

    /** Public catalog: product chưa xóa + category chưa xóa. */
    public static Specification<ProductEntity> publicCatalogBase() {
        return notDeleted().and(categoryActive());
    }

    public static Specification<ProductEntity> withCategoryId(UUID categoryId) {
        if (categoryId == null) return Specification.where(null);
        return (root, query, cb) -> cb.equal(root.get("categoryId"), categoryId);
    }

    public static Specification<ProductEntity> withIsAvailable(Boolean isAvailable) {
        if (isAvailable == null) return Specification.where(null);
        return (root, query, cb) -> cb.equal(root.get("isAvailable"), isAvailable);
    }

    public static Specification<ProductEntity> withIsFeatured(Boolean isFeatured) {
        if (isFeatured == null) return Specification.where(null);
        return (root, query, cb) -> cb.equal(root.get("isFeatured"), isFeatured);
    }

    /** Tìm kiếm OR trên name và description (case-insensitive). */
    public static Specification<ProductEntity> withKeyword(String keyword) {
        if (keyword == null || keyword.isBlank()) return Specification.where(null);
        String pattern = "%" + keyword.toLowerCase() + "%";
        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("name")), pattern),
                cb.like(cb.lower(root.get("description")), pattern)
        );
    }
}
