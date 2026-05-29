package com.beverage.inventory.infrastructure.persistence.repository;

import com.beverage.inventory.infrastructure.persistence.entity.IngredientEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.UUID;

@Repository
public interface IngredientJpaRepository extends JpaRepository<IngredientEntity, UUID> {

    @Modifying
    @Query("UPDATE IngredientEntity i SET i.currentStock = i.currentStock - :quantity, i.updatedAt = CURRENT_TIMESTAMP WHERE i.id = :id AND i.currentStock >= :quantity")
    int deductStock(@Param("id") UUID id, @Param("quantity") BigDecimal quantity);

    @Modifying
    @Query("UPDATE IngredientEntity i SET i.currentStock = i.currentStock + :quantity, i.updatedAt = CURRENT_TIMESTAMP WHERE i.id = :id")
    int addStock(@Param("id") UUID id, @Param("quantity") BigDecimal quantity);
}
