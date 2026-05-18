package com.beverage.product.infrastructure.persistence.repository;

import com.beverage.product.infrastructure.persistence.entity.ToppingEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ToppingJpaRepository extends JpaRepository<ToppingEntity, UUID> {

    Optional<ToppingEntity> findByIdAndDeletedAtIsNull(UUID id);

    List<ToppingEntity> findByIsAvailableTrueAndDeletedAtIsNullOrderByDisplayOrderAsc();

    @Query("SELECT t FROM ToppingEntity t WHERE t.id IN :ids AND t.deletedAt IS NULL")
    List<ToppingEntity> findActiveByIdIn(@Param("ids") List<UUID> ids);

    @Query("SELECT t FROM ToppingEntity t ORDER BY t.displayOrder ASC, t.name ASC")
    List<ToppingEntity> findAllForCatalogOrderByDisplayOrderAsc();
}
