package com.beverage.inventory.infrastructure.persistence.repository;

import com.beverage.inventory.infrastructure.persistence.entity.RecipeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RecipeJpaRepository extends JpaRepository<RecipeEntity, UUID> {
    Optional<RecipeEntity> findByProductIdAndVariantId(UUID productId, UUID variantId);
    Optional<RecipeEntity> findByProductIdAndVariantIdIsNull(UUID productId);
}
