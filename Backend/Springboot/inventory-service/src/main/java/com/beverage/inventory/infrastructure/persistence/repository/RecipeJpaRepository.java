package com.beverage.inventory.infrastructure.persistence.repository;

import com.beverage.inventory.infrastructure.persistence.entity.RecipeEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RecipeJpaRepository extends JpaRepository<RecipeEntity, UUID> {
    Optional<RecipeEntity> findByProductIdAndVariantId(UUID productId, UUID variantId);
    Optional<RecipeEntity> findByProductIdAndVariantIdIsNull(UUID productId);

    @Query("SELECT r FROM RecipeEntity r WHERE " +
           "(CAST(:isActive AS boolean) IS NULL OR r.isActive = :isActive)")
    Page<RecipeEntity> findRecipesWithFilters(@Param("isActive") Boolean isActive, Pageable pageable);
}
