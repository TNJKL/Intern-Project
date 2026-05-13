package com.beverage.product.infrastructure.persistence.repository;

import com.beverage.product.domain.entity.Product;
import com.beverage.product.domain.repository.ProductRepository;
import com.beverage.product.infrastructure.persistence.mapper.ProductMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class ProductRepositoryImpl implements ProductRepository {

    private final ProductJpaRepository productJpaRepository;
    private final ProductMapper productMapper;

    @Override
    public Product save(Product product) {
        return productMapper.toDomain(
                productJpaRepository.save(productMapper.toEntity(product))
        );
    }

    @Override
    public Optional<Product> findActiveById(UUID id) {
        return productJpaRepository.findByIdAndDeletedAtIsNull(id).map(productMapper::toDomain);
    }

    @Override
    public Optional<Product> findIncludingDeletedById(UUID id) {
        return productJpaRepository.findById(id).map(productMapper::toDomain);
    }

    @Override
    public Optional<Product> findActiveBySlug(String slug) {
        return productJpaRepository.findBySlugAndDeletedAtIsNull(slug).map(productMapper::toDomain);
    }

    @Override
    public boolean existsActiveBySlug(String slug) {
        return productJpaRepository.existsBySlugAndDeletedAtIsNull(slug);
    }

    @Override
    public boolean existsActiveBySlugExcludingId(String slug, UUID excludeId) {
        return productJpaRepository.existsBySlugAndDeletedAtIsNullAndIdNot(slug, excludeId);
    }

    @Override
    public List<Product> findAll() {
        return productJpaRepository.findAll().stream()
                .map(productMapper::toDomain)
                .toList();
    }

    @Override
    public List<Product> listCatalog(UUID categoryId, boolean includeDeleted) {
        if (includeDeleted) {
            return productJpaRepository.findAllForManagement(categoryId).stream()
                    .map(productMapper::toDomain)
                    .toList();
        }
        return productJpaRepository.findActiveCatalog(categoryId).stream()
                .map(productMapper::toDomain)
                .toList();
    }
}
