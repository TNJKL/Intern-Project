package com.beverage.product.application.usecase;

import com.beverage.product.application.dto.request.CreateProductRequest;
import com.beverage.product.application.dto.request.InitialVariantRequest;
import com.beverage.product.application.dto.request.UpdateProductRequest;
import com.beverage.product.application.dto.response.ProductResponse;
import com.beverage.product.application.mapper.ProductDtoMapper;
import com.beverage.product.application.service.CatalogSlugService;
import com.beverage.product.domain.entity.Product;
import com.beverage.product.domain.entity.ProductTopping;
import com.beverage.product.domain.entity.ProductVariant;
import com.beverage.product.domain.entity.Topping;
import com.beverage.product.domain.exception.BusinessException;
import com.beverage.product.domain.exception.ResourceNotFoundException;
import com.beverage.product.domain.repository.CategoryRepository;
import com.beverage.product.domain.repository.ProductRepository;
import com.beverage.product.domain.repository.ProductToppingRepository;
import com.beverage.product.domain.repository.ProductVariantRepository;
import com.beverage.product.domain.repository.ToppingRepository;
import com.beverage.product.infrastructure.cache.RedisCacheService;
import com.beverage.product.infrastructure.storage.CatalogImageStorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.function.Predicate;

@Service
@RequiredArgsConstructor
public class ProductUseCase {

    private static final String CACHE_PRODUCT_PREFIX = "cache:product:";

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ToppingRepository toppingRepository;
    private final ProductToppingRepository productToppingRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ProductDtoMapper productDtoMapper;
    private final RedisCacheService redisCacheService;
    private final CatalogImageStorageService catalogImageStorageService;
    private final CatalogSlugService catalogSlugService;

    @Transactional
    public ProductResponse createProduct(@Valid CreateProductRequest request) {
        categoryRepository.findActiveById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));

        List<UUID> toppingIds = normalizeToppingIds(request.getToppingIds());
        validateToppingsExist(toppingIds);

        if (request.getInitialVariants() != null && !request.getInitialVariants().isEmpty()) {
            validateInitialVariantDuplicates(request.getInitialVariants());
        }

        Product product = productDtoMapper.toDomainCreate(request);
        Predicate<String> taken = productRepository::existsActiveBySlug;
        product.setSlug(resolveSlugOnCreate(request.getSlug(), request.getName(), taken));
        Product saved = productRepository.save(product);

        List<Topping> toppings = toppingRepository.findActiveByIds(toppingIds);
        for (UUID toppingId : toppingIds) {
            ProductTopping pt = ProductTopping.builder()
                    .id(null)
                    .productId(saved.getId())
                    .toppingId(toppingId)
                    .build();
            productToppingRepository.save(pt);
        }

        if (request.getInitialVariants() != null && !request.getInitialVariants().isEmpty()) {
            for (InitialVariantRequest iv : request.getInitialVariants()) {
                ProductVariant v = ProductVariant.builder()
                        .id(null)
                        .productId(saved.getId())
                        .sizeLabel(ProductVariantUseCase.normalizeSizeLabel(iv.getSizeLabel()))
                        .price(iv.getPrice())
                        .isAvailable(iv.getIsAvailable() != null ? iv.getIsAvailable() : Boolean.TRUE)
                        .displayOrder(iv.getDisplayOrder() != null ? iv.getDisplayOrder() : (short) 0)
                        .deletedAt(null)
                        .build();
                productVariantRepository.save(v);
            }
        }

        List<ProductVariant> variants = productVariantRepository.findActiveByProductId(saved.getId());
        redisCacheService.delete(getProductCacheKey(saved.getId()));
        return productDtoMapper.toResponse(saved, toppings, variants);
    }

    public ProductResponse updateProduct(UUID productId, @Valid UpdateProductRequest request) {
        Product existing = productRepository.findActiveById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        categoryRepository.findActiveById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));

        List<UUID> toppingIds = normalizeToppingIds(request.getToppingIds());
        validateToppingsExist(toppingIds);

        Product updated = productDtoMapper.toDomainUpdate(request);
        String newSlug = catalogSlugService.slugify(updated.getSlug());
        updated.setSlug(newSlug);
        if (!newSlug.equals(existing.getSlug()) && productRepository.existsActiveBySlugExcludingId(newSlug, productId)) {
            throw new BusinessException("Slug đã được sản phẩm khác sử dụng.", "SLUG_CONFLICT");
        }

        updated.setId(existing.getId());
        updated.setDeletedAt(existing.getDeletedAt());
        updated.setCreatedAt(existing.getCreatedAt());
        if (updated.getImageUrl() == null || updated.getImageUrl().isBlank()) {
            updated.setImageUrl(existing.getImageUrl());
        }

        Product saved = productRepository.save(updated);

        productToppingRepository.deleteByProductId(saved.getId());
        List<Topping> toppings = toppingRepository.findActiveByIds(toppingIds);
        for (UUID toppingId : toppingIds) {
            ProductTopping pt = ProductTopping.builder()
                    .id(null)
                    .productId(saved.getId())
                    .toppingId(toppingId)
                    .build();
            productToppingRepository.save(pt);
        }

        catalogImageStorageService.deleteIfChangedQuietly(existing.getImageUrl(), saved.getImageUrl());

        List<ProductVariant> variants = productVariantRepository.findActiveByProductId(saved.getId());
        redisCacheService.delete(getProductCacheKey(saved.getId()));
        return productDtoMapper.toResponse(saved, toppings, variants);
    }

    public void deleteProduct(UUID productId) {
        Product existing = productRepository.findActiveById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));
        existing.setDeletedAt(LocalDateTime.now());
        productRepository.save(existing);
        redisCacheService.delete(getProductCacheKey(productId));
    }

    public void restoreProduct(UUID productId) {
        Product existing = productRepository.findIncludingDeletedById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));
        if (existing.getDeletedAt() == null) {
            throw new BusinessException("Sản phẩm chưa nằm trong thùng rác (đang hoạt động).", "NOT_SOFT_DELETED");
        }
        if (productRepository.existsActiveBySlug(existing.getSlug())) {
            throw new BusinessException(
                    "Không thể khôi phục: slug \"" + existing.getSlug()
                            + "\" đã được sản phẩm đang hoạt động sử dụng. Cần đổi slug bản ghi đã xóa trước.",
                    "SLUG_CONFLICT_RESTORE");
        }
        categoryRepository.findActiveById(existing.getCategoryId())
                .orElseThrow(() -> new BusinessException(
                        "Danh mục của sản phẩm không còn hoạt động; hãy gán category khác (qua DB hoặc API) trước khi khôi phục.",
                        "CATEGORY_NOT_ACTIVE"));
        existing.setDeletedAt(null);
        productRepository.save(existing);
        redisCacheService.delete(getProductCacheKey(productId));
    }

    public ProductResponse getProductDetail(UUID productId) {
        ProductResponse cached = redisCacheService.get(getProductCacheKey(productId), ProductResponse.class);
        if (cached != null) {
            return cached;
        }

        Product product = productRepository.findActiveById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        List<ProductTopping> productToppings = productToppingRepository.findByProductId(productId);
        List<UUID> toppingIds = productToppings.stream()
                .map(ProductTopping::getToppingId)
                .toList();

        List<Topping> toppings = toppingRepository.findActiveByIds(toppingIds);
        List<ProductVariant> variants = productVariantRepository.findActiveByProductId(productId);
        ProductResponse response = productDtoMapper.toResponse(product, toppings, variants);
        redisCacheService.set(getProductCacheKey(productId), response);
        return response;
    }

    public List<ProductResponse> listProducts(UUID categoryId, Boolean isAvailable, Boolean isFeatured, boolean includeDeleted) {
        List<Product> products = productRepository.listCatalog(categoryId, includeDeleted);

        List<Product> filtered = products.stream()
                .filter(p -> isAvailable == null || Objects.equals(p.getIsAvailable(), isAvailable))
                .filter(p -> isFeatured == null || Objects.equals(p.getIsFeatured(), isFeatured))
                .toList();

        List<UUID> ids = filtered.stream().map(Product::getId).toList();
        Map<UUID, List<ProductVariant>> variantMap = productVariantRepository.findActiveByProductIds(ids);

        return filtered.stream()
                .map(p -> assembleProductResponse(p, variantMap.getOrDefault(p.getId(), List.of())))
                .toList();
    }

    private ProductResponse assembleProductResponse(Product product, List<ProductVariant> variants) {
        List<ProductTopping> productToppings = productToppingRepository.findByProductId(product.getId());
        List<UUID> toppingIds = productToppings.stream()
                .map(ProductTopping::getToppingId)
                .toList();
        List<Topping> toppings = toppingRepository.findActiveByIds(toppingIds);
        return productDtoMapper.toResponse(product, toppings, variants);
    }

    private void validateInitialVariantDuplicates(List<InitialVariantRequest> list) {
        Set<String> seen = new HashSet<>();
        for (InitialVariantRequest iv : list) {
            String label = ProductVariantUseCase.normalizeSizeLabel(iv.getSizeLabel());
            String key = label == null ? "\u0000default" : label;
            if (!seen.add(key)) {
                throw new BusinessException("initialVariants chứa size_label trùng nhau.", "DUPLICATE_VARIANT_LABEL");
            }
        }
    }

    private void validateToppingsExist(List<UUID> toppingIds) {
        if (toppingIds == null || toppingIds.isEmpty()) {
            return;
        }

        List<Topping> found = toppingRepository.findActiveByIds(toppingIds);
        if (found.size() != toppingIds.size()) {
            throw new ResourceNotFoundException("Topping", "ids", toppingIds);
        }
    }

    private static List<UUID> normalizeToppingIds(List<UUID> raw) {
        if (raw == null || raw.isEmpty()) {
            return List.of();
        }
        return raw.stream().filter(Objects::nonNull).distinct().toList();
    }

    private String getProductCacheKey(UUID productId) {
        return CACHE_PRODUCT_PREFIX + productId;
    }

    private String resolveSlugOnCreate(String optionalSlug, String name, Predicate<String> slugTakenInActive) {
        if (optionalSlug != null && !optionalSlug.isBlank()) {
            String normalized = catalogSlugService.slugify(optionalSlug);
            if (slugTakenInActive.test(normalized)) {
                throw new BusinessException("Slug đã tồn tại trên sản phẩm đang hoạt động.", "SLUG_CONFLICT");
            }
            return normalized;
        }
        return catalogSlugService.allocateUniqueSlug(name, slugTakenInActive);
    }
}
