package com.beverage.product.infrastructure.persistence.repository;

import com.beverage.product.domain.entity.Category;
import com.beverage.product.domain.repository.CategoryRepository;
import com.beverage.product.infrastructure.persistence.mapper.CategoryMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class CategoryRepositoryImpl implements CategoryRepository {

    private final CategoryJpaRepository categoryJpaRepository;
    private final CategoryMapper categoryMapper;

    @Override
    public Category save(Category category) {
        return categoryMapper.toDomain(
                categoryJpaRepository.save(categoryMapper.toEntity(category))
        );
    }

    @Override
    public Optional<Category> findById(UUID id) {
        return categoryJpaRepository.findById(id).map(categoryMapper::toDomain);
    }

    @Override
    public Optional<Category> findBySlug(String slug) {
        return categoryJpaRepository.findBySlug(slug).map(categoryMapper::toDomain);
    }

    @Override
    public List<Category> findAllActive() {
        return categoryJpaRepository.findByIsActiveTrue().stream()
                .map(categoryMapper::toDomain)
                .toList();
    }

    @Override
    public void deleteById(UUID id) {
        categoryJpaRepository.deleteById(id);
    }
}

