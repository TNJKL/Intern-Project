package com.beverage.product.application.usecase;

import com.beverage.product.application.dto.request.CreateProductVariantRequest;
import com.beverage.product.application.dto.request.UpdateProductVariantRequest;
import com.beverage.product.application.dto.response.ProductVariantResponse;
import com.beverage.product.application.mapper.ProductVariantDtoMapper;
import com.beverage.product.domain.entity.Product;
import com.beverage.product.domain.entity.ProductVariant;
import com.beverage.product.domain.exception.BusinessException;
import com.beverage.product.domain.exception.ResourceNotFoundException;
import com.beverage.product.domain.repository.ProductRepository;
import com.beverage.product.domain.repository.ProductVariantRepository;
import com.beverage.product.infrastructure.cache.CatalogCacheKeys;
import com.beverage.product.infrastructure.cache.RedisCacheService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Validated
public class ProductVariantUseCase {

    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ProductVariantDtoMapper productVariantDtoMapper;
    private final RedisCacheService redisCacheService;

    public List<ProductVariantResponse> listVariants(UUID productId) {
        loadActiveProduct(productId);
        return productVariantRepository.findActiveByProductId(productId).stream()
                .map(productVariantDtoMapper::toResponse)
                .toList();
    }

    public ProductVariantResponse createVariant(UUID productId, @Valid CreateProductVariantRequest request) {
        Product product = loadActiveProduct(productId);
        String label = normalizeSizeLabel(request.getSizeLabel());
        assertUniqueSizeLabel(productId, label, null);

        ProductVariant toSave = ProductVariant.builder()
                .id(null)
                .productId(productId)
                .sizeLabel(label)
                .price(request.getPrice())
                .isAvailable(request.getIsAvailable() != null ? request.getIsAvailable() : Boolean.TRUE)
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : (short) 0)
                .deletedAt(null)
                .build();
        ProductVariant saved = productVariantRepository.save(toSave);
        evictProductCache(productId, product.getSlug());
        return productVariantDtoMapper.toResponse(saved);
    }

    public ProductVariantResponse updateVariant(UUID productId, UUID variantId, @Valid UpdateProductVariantRequest request) {
        Product product = loadActiveProduct(productId);
        ProductVariant existing = productVariantRepository.findActiveByIdAndProductId(variantId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("ProductVariant", "id", variantId));

        String newLabel = request.getSizeLabel() != null
                ? normalizeSizeLabel(request.getSizeLabel())
                : existing.getSizeLabel();
        if (!Objects.equals(existing.getSizeLabel(), newLabel)) {
            assertUniqueSizeLabel(productId, newLabel, variantId);
        }

        if (request.getPrice() != null) existing.setPrice(request.getPrice());
        if (request.getIsAvailable() != null) existing.setIsAvailable(request.getIsAvailable());
        if (request.getDisplayOrder() != null) existing.setDisplayOrder(request.getDisplayOrder());
        existing.setSizeLabel(newLabel);

        ProductVariant saved = productVariantRepository.save(existing);
        evictProductCache(productId, product.getSlug());
        return productVariantDtoMapper.toResponse(saved);
    }

    public void deleteVariant(UUID productId, UUID variantId) {
        Product product = loadActiveProduct(productId);
        if (productVariantRepository.findActiveByIdAndProductId(variantId, productId).isEmpty()) {
            throw new ResourceNotFoundException("ProductVariant", "id", variantId);
        }
        productVariantRepository.softDelete(variantId, productId);
        evictProductCache(productId, product.getSlug());
    }

    private Product loadActiveProduct(UUID productId) {
        return productRepository.findActiveById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));
    }

    private void evictProductCache(UUID productId, String slug) {
        redisCacheService.delete(CatalogCacheKeys.productById(productId));
        redisCacheService.delete(CatalogCacheKeys.productBySlug(slug));
    }

    public static String normalizeSizeLabel(String raw) {
        if (raw == null) return null;
        String t = raw.trim();
        return t.isEmpty() ? null : t;
    }

    private void assertUniqueSizeLabel(UUID productId, String normalizedLabel, UUID excludeVariantId) {
        for (ProductVariant v : productVariantRepository.findActiveByProductId(productId)) {
            if (excludeVariantId != null && excludeVariantId.equals(v.getId())) continue;
            if (Objects.equals(v.getSizeLabel(), normalizedLabel)) {
                throw new BusinessException("Đã tồn tại variant cùng size_label cho sản phẩm này.", "DUPLICATE_VARIANT_LABEL");
            }
        }
    }
}
