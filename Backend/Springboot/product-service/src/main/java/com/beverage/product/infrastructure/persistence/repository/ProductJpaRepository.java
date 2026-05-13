package com.beverage.product.infrastructure.persistence.repository;

import com.beverage.product.infrastructure.persistence.entity.ProductEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductJpaRepository extends JpaRepository<ProductEntity, UUID> {

    Optional<ProductEntity> findByIdAndDeletedAtIsNull(UUID id);

    Optional<ProductEntity> findBySlugAndDeletedAtIsNull(String slug);

    boolean existsBySlugAndDeletedAtIsNull(String slug);

    boolean existsBySlugAndDeletedAtIsNullAndIdNot(String slug, UUID id);

    @Query("""
            SELECT p FROM ProductEntity p, CategoryEntity c
            WHERE p.categoryId = c.id
              AND p.deletedAt IS NULL
              AND c.deletedAt IS NULL
              AND (:categoryId IS NULL OR p.categoryId = :categoryId)
            ORDER BY p.displayOrder ASC, p.name ASC
            """)
    List<ProductEntity> findActiveCatalog(@Param("categoryId") UUID categoryId);

    @Query("""
            SELECT p FROM ProductEntity p
            WHERE (:categoryId IS NULL OR p.categoryId = :categoryId)
            ORDER BY p.displayOrder ASC, p.name ASC
            """)
    List<ProductEntity> findAllForManagement(@Param("categoryId") UUID categoryId);
}
