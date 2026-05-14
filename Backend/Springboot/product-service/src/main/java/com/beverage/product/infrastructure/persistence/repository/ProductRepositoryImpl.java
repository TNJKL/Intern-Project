package com.beverage.product.infrastructure.persistence.repository;

import com.beverage.product.domain.entity.Product;
import com.beverage.product.domain.repository.ProductRepository;
import com.beverage.product.infrastructure.persistence.mapper.ProductMapper;
import com.beverage.product.infrastructure.persistence.spec.ProductSpecifications;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    @Override
    public Page<Product> pageCatalog(UUID categoryId, Boolean isAvailable, Boolean isFeatured,
                                      String keyword, boolean includeDeleted, Pageable pageable) {
        var base = includeDeleted
                ? ProductSpecifications.withCategoryId(categoryId)
                : ProductSpecifications.publicCatalogBase()
                        .and(ProductSpecifications.withCategoryId(categoryId));

        var spec = base
                .and(ProductSpecifications.withIsAvailable(isAvailable))
                .and(ProductSpecifications.withIsFeatured(isFeatured))
                .and(ProductSpecifications.withKeyword(keyword));

        return productJpaRepository.findAll(spec, pageable).map(productMapper::toDomain);
    }

    @Override
    public List<Product> findAllActiveByIds(List<UUID> ids) {
        if (ids == null || ids.isEmpty()) return List.of();
        return productJpaRepository.findActiveByIdIn(ids).stream()
                .map(productMapper::toDomain)
                .toList();
    }
}
