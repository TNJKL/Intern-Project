package com.beverage.product.domain.repository;

import com.beverage.product.domain.entity.Product;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductRepository {
    Product save(Product product);

    Optional<Product> findById(UUID id);

    Optional<Product> findBySlug(String slug);

    List<Product> findByCategoryId(UUID categoryId);

    List<Product> findAll();

    void deleteById(UUID id);
}

