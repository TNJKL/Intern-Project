package com.beverage.product.infrastructure.persistence.repository;

import com.beverage.product.infrastructure.persistence.entity.ProductToppingEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProductToppingJpaRepository extends JpaRepository<ProductToppingEntity, UUID> {

    List<ProductToppingEntity> findByProductId(UUID productId);

    void deleteByProductId(UUID productId);
}

