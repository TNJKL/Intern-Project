package com.beverage.inventory.infrastructure.persistence.repository;

import com.beverage.inventory.infrastructure.persistence.entity.InventoryTransactionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InventoryTransactionJpaRepository extends JpaRepository<InventoryTransactionEntity, UUID> {
    List<InventoryTransactionEntity> findByIngredientIdOrderByCreatedAtDesc(UUID ingredientId);
    List<InventoryTransactionEntity> findByOrderId(UUID orderId);
}
