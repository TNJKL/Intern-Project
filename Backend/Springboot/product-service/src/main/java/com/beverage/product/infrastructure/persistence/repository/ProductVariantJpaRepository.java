package com.beverage.product.infrastructure.persistence.repository;

import com.beverage.product.infrastructure.persistence.entity.ProductVariantEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface ProductVariantJpaRepository extends JpaRepository<ProductVariantEntity, UUID> {

    List<ProductVariantEntity> findByProductIdAndDeletedAtIsNullOrderByDisplayOrderAsc(UUID productId);

    List<ProductVariantEntity> findByProductIdInAndDeletedAtIsNullOrderByProductIdAscDisplayOrderAsc(
            Collection<UUID> productIds);

    Optional<ProductVariantEntity> findByIdAndProductIdAndDeletedAtIsNull(UUID id, UUID productId);
}
