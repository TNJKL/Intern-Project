package com.beverage.inventory.infrastructure.persistence.repository;

import com.beverage.inventory.domain.model.InventoryTransactionType;
import com.beverage.inventory.infrastructure.persistence.entity.InventoryTransactionEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InventoryTransactionJpaRepository extends JpaRepository<InventoryTransactionEntity, UUID> {
    List<InventoryTransactionEntity> findByIngredientIdOrderByCreatedAtDesc(UUID ingredientId);
    List<InventoryTransactionEntity> findByOrderId(UUID orderId);

    @Query("SELECT t FROM InventoryTransactionEntity t WHERE " +
           "(:ingredientId IS NULL OR t.ingredientId = :ingredientId) AND " +
           "(:orderId IS NULL OR t.orderId = :orderId) AND " +
           "(:transactionType IS NULL OR t.transactionType = :transactionType)")
    Page<InventoryTransactionEntity> findTransactionsWithFilters(
            @Param("ingredientId") UUID ingredientId,
            @Param("orderId") UUID orderId,
            @Param("transactionType") InventoryTransactionType transactionType,
            Pageable pageable);
}
