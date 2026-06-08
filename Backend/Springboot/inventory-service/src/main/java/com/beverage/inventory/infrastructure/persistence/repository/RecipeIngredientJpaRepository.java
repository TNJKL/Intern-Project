package com.beverage.inventory.infrastructure.persistence.repository;

import com.beverage.inventory.infrastructure.persistence.entity.RecipeIngredientEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RecipeIngredientJpaRepository extends JpaRepository<RecipeIngredientEntity, UUID> {
    List<RecipeIngredientEntity> findByRecipeId(UUID recipeId);

    List<RecipeIngredientEntity> findByRecipeIdIn(List<UUID> recipeIds);
}
