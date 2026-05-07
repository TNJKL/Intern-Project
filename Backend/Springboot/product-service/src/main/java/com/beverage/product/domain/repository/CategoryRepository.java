package com.beverage.product.domain.repository;

import com.beverage.product.domain.entity.Category;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CategoryRepository {
    Category save(Category category);

    Optional<Category> findById(UUID id);

    Optional<Category> findBySlug(String slug);

    List<Category> findAllActive();

    void deleteById(UUID id);
}

