package com.beverage.product.infrastructure.persistence.repository;

import com.beverage.product.domain.entity.ProductTopping;
import com.beverage.product.domain.repository.ProductToppingRepository;
import com.beverage.product.infrastructure.persistence.mapper.ProductToppingMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class ProductToppingRepositoryImpl implements ProductToppingRepository {

    private final ProductToppingJpaRepository productToppingJpaRepository;
    private final ProductToppingMapper productToppingMapper;

    @Override
    public ProductTopping save(ProductTopping productTopping) {
        return productToppingMapper.toDomain(
                productToppingJpaRepository.save(productToppingMapper.toEntity(productTopping))
        );
    }

    @Override
    public Optional<ProductTopping> findById(UUID id) {
        return productToppingJpaRepository.findById(id)
                .map(productToppingMapper::toDomain);
    }

    @Override
    public List<ProductTopping> findByProductId(UUID productId) {
        return productToppingJpaRepository.findByProductId(productId).stream()
                .map(productToppingMapper::toDomain)
                .toList();
    }

    @Override
    public void deleteByProductId(UUID productId) {
        productToppingJpaRepository.deleteByProductId(productId);
    }
}

