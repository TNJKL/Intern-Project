package com.beverage.product.infrastructure.persistence.repository;

import com.beverage.product.domain.entity.ProductVariant;
import com.beverage.product.domain.repository.ProductVariantRepository;
import com.beverage.product.infrastructure.persistence.mapper.ProductVariantMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
public class ProductVariantRepositoryImpl implements ProductVariantRepository {

    private final ProductVariantJpaRepository jpaRepository;
    private final ProductVariantMapper mapper;

    @Override
    public List<ProductVariant> findActiveByProductId(UUID productId) {
        return jpaRepository.findByProductIdAndDeletedAtIsNullOrderByDisplayOrderAsc(productId).stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public Map<UUID, List<ProductVariant>> findActiveByProductIds(Collection<UUID> productIds) {
        if (productIds == null || productIds.isEmpty()) {
            return Map.of();
        }
        List<ProductVariant> all = jpaRepository
                .findByProductIdInAndDeletedAtIsNullOrderByProductIdAscDisplayOrderAsc(productIds).stream()
                .map(mapper::toDomain)
                .toList();
        return all.stream().collect(Collectors.groupingBy(ProductVariant::getProductId, LinkedHashMap::new, Collectors.toList()));
    }

    @Override
    public Optional<ProductVariant> findActiveByIdAndProductId(UUID variantId, UUID productId) {
        return jpaRepository.findByIdAndProductIdAndDeletedAtIsNull(variantId, productId).map(mapper::toDomain);
    }

    @Override
    public ProductVariant save(ProductVariant variant) {
        return mapper.toDomain(jpaRepository.save(mapper.toEntity(variant)));
    }

    @Override
    public void softDelete(UUID variantId, UUID productId) {
        jpaRepository.findByIdAndProductIdAndDeletedAtIsNull(variantId, productId).ifPresent(entity -> {
            entity.setDeletedAt(LocalDateTime.now());
            jpaRepository.save(entity);
        });
    }
}
