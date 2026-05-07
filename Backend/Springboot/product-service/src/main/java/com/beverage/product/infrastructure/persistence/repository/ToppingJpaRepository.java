package com.beverage.product.infrastructure.persistence.repository;

import com.beverage.product.infrastructure.persistence.entity.ToppingEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ToppingJpaRepository extends JpaRepository<ToppingEntity, UUID> {
    List<ToppingEntity> findByIsAvailableTrue();

    List<ToppingEntity> findByIdIn(List<UUID> ids);
}

