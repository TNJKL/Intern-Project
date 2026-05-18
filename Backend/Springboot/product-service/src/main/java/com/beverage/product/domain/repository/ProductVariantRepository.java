package com.beverage.product.domain.repository;

import com.beverage.product.domain.entity.ProductVariant;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

public interface ProductVariantRepository {

    List<ProductVariant> findActiveByProductId(UUID productId);

    /** productId -> danh sách variant active, sort display_order */
    Map<UUID, List<ProductVariant>> findActiveByProductIds(Collection<UUID> productIds);

    Optional<ProductVariant> findActiveByIdAndProductId(UUID variantId, UUID productId);

    ProductVariant save(ProductVariant variant);

    void softDelete(UUID variantId, UUID productId);
}
