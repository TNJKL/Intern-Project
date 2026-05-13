package com.beverage.product.infrastructure.persistence.repository;

import com.beverage.product.infrastructure.persistence.entity.CategoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CategoryJpaRepository extends JpaRepository<CategoryEntity, UUID> {

    Optional<CategoryEntity> findByIdAndDeletedAtIsNull(UUID id);

    Optional<CategoryEntity> findBySlugAndDeletedAtIsNull(String slug);

    boolean existsBySlugAndDeletedAtIsNull(String slug);

    boolean existsBySlugAndDeletedAtIsNullAndIdNot(String slug, UUID id);

    List<CategoryEntity> findByIsActiveTrueAndDeletedAtIsNullOrderByDisplayOrderAsc();

    @Query("SELECT c FROM CategoryEntity c ORDER BY c.displayOrder ASC, c.name ASC")
    List<CategoryEntity> findAllForCatalogOrderByDisplayOrderAsc();
}
