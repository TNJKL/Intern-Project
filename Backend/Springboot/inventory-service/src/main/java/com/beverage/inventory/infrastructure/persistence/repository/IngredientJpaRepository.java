package com.beverage.inventory.infrastructure.persistence.repository;

import com.beverage.inventory.infrastructure.persistence.entity.IngredientEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface IngredientJpaRepository extends JpaRepository<IngredientEntity, UUID> {

    @Modifying
    @Query("UPDATE IngredientEntity i SET i.currentStock = i.currentStock - :quantity, i.updatedAt = CURRENT_TIMESTAMP WHERE i.id = :id AND i.currentStock >= :quantity")
    int deductStock(@Param("id") UUID id, @Param("quantity") BigDecimal quantity);

    @Modifying
    @Query("UPDATE IngredientEntity i SET i.currentStock = i.currentStock + :quantity, i.updatedAt = CURRENT_TIMESTAMP WHERE i.id = :id")
    int addStock(@Param("id") UUID id, @Param("quantity") BigDecimal quantity);

    @Query("SELECT i FROM IngredientEntity i WHERE " +
           "(:name IS NULL OR LOWER(i.name) LIKE LOWER(CONCAT('%', :name, '%'))) AND " +
           "(:isActive IS NULL OR i.isActive = :isActive)")
    Page<IngredientEntity> findIngredientsWithFilters(
            @Param("name") String name,
            @Param("isActive") Boolean isActive,
            Pageable pageable);

    @Query("SELECT i FROM IngredientEntity i WHERE i.isActive = true AND " +
           "(:lowStock = false OR i.currentStock <= i.lowStockThreshold)")
    List<IngredientEntity> findStock(@Param("lowStock") boolean lowStock);
}
