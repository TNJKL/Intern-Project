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
    public Optional<Category> findActiveById(UUID id) {
        return categoryJpaRepository.findByIdAndDeletedAtIsNull(id).map(categoryMapper::toDomain);
    }

    @Override
    public Optional<Category> findIncludingDeletedById(UUID id) {
        return categoryJpaRepository.findById(id).map(categoryMapper::toDomain);
    }

    @Override
    public Optional<Category> findActiveBySlug(String slug) {
        return categoryJpaRepository.findBySlugAndDeletedAtIsNull(slug).map(categoryMapper::toDomain);
    }

    @Override
    public boolean existsActiveBySlug(String slug) {
        return categoryJpaRepository.existsBySlugAndDeletedAtIsNull(slug);
    }

    @Override
    public boolean existsActiveBySlugExcludingId(String slug, UUID excludeId) {
        return categoryJpaRepository.existsBySlugAndDeletedAtIsNullAndIdNot(slug, excludeId);
    }

    @Override
    public List<Category> findAll() {
        return categoryJpaRepository.findAll().stream()
                .map(categoryMapper::toDomain)
                .toList();
    }

    @Override
    public List<Category> listCatalog(boolean includeDeleted) {
        if (includeDeleted) {
            return categoryJpaRepository.findAllForCatalogOrderByDisplayOrderAsc().stream()
                    .map(categoryMapper::toDomain)
                    .toList();
        }
        return categoryJpaRepository.findByIsActiveTrueAndDeletedAtIsNullOrderByDisplayOrderAsc().stream()
                .map(categoryMapper::toDomain)
                .toList();
    }
}
