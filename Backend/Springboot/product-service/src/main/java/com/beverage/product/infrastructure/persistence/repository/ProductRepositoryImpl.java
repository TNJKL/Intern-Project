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
    public Optional<Product> findById(UUID id) {
        return productJpaRepository.findById(id).map(productMapper::toDomain);
    }

    @Override
    public Optional<Product> findBySlug(String slug) {
        return productJpaRepository.findBySlug(slug).map(productMapper::toDomain);
    }

    @Override
    public List<Product> findByCategoryId(UUID categoryId) {
        return productJpaRepository.findByCategoryId(categoryId).stream()
                .map(productMapper::toDomain)
                .toList();
    }

    @Override
    public List<Product> findAll() {
        return productJpaRepository.findAll().stream()
                .map(productMapper::toDomain)
                .toList();
    }

    @Override
    public void deleteById(UUID id) {
        productJpaRepository.deleteById(id);
    }
}

