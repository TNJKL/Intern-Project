package com.beverage.product.domain.repository;

import com.beverage.product.domain.entity.ProductTopping;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductToppingRepository {
    ProductTopping save(ProductTopping productTopping);

    Optional<ProductTopping> findById(UUID id);

    List<ProductTopping> findByProductId(UUID productId);

    void deleteByProductId(UUID productId);
}

