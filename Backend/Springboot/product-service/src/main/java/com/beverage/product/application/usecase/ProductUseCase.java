package com.beverage.product.application.usecase;

import com.beverage.product.application.dto.request.CreateProductRequest;
import com.beverage.product.application.dto.request.InitialVariantRequest;
import com.beverage.product.application.dto.request.ReorderItemRequest;
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
import com.beverage.product.infrastructure.cache.CatalogCacheKeys;
import com.beverage.product.infrastructure.cache.RedisCacheService;
import com.beverage.product.infrastructure.security.AuditActorResolver;
import com.beverage.product.infrastructure.storage.CatalogImageStorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import com.beverage.product.application.dto.response.ProductSuggestResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductUseCase {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ToppingRepository toppingRepository;
    private final ProductToppingRepository productToppingRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ProductDtoMapper productDtoMapper;
    private final RedisCacheService redisCacheService;
    private final CatalogImageStorageService catalogImageStorageService;
    private final CatalogSlugService catalogSlugService;
    private final AuditActorResolver auditActorResolver;

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
        auditActorResolver.currentActorId().ifPresent(actor -> {
            product.setCreatedBy(actor);
            product.setUpdatedBy(actor);
        });
        Product saved = productRepository.save(product);

        List<Topping> toppings = toppingRepository.findActiveByIds(toppingIds);
        for (UUID toppingId : toppingIds) {
            productToppingRepository.save(ProductTopping.builder()
                    .id(null).productId(saved.getId()).toppingId(toppingId).build());
        }

        if (request.getInitialVariants() != null && !request.getInitialVariants().isEmpty()) {
            for (InitialVariantRequest iv : request.getInitialVariants()) {
                productVariantRepository.save(ProductVariant.builder()
                        .id(null)
                        .productId(saved.getId())
                        .sizeLabel(ProductVariantUseCase.normalizeSizeLabel(iv.getSizeLabel()))
                        .price(iv.getPrice())
                        .isAvailable(iv.getIsAvailable() != null ? iv.getIsAvailable() : Boolean.TRUE)
                        .displayOrder(iv.getDisplayOrder() != null ? iv.getDisplayOrder() : (short) 0)
                        .deletedAt(null)
                        .build());
            }
        }

        List<ProductVariant> variants = productVariantRepository.findActiveByProductId(saved.getId());
        evictProductCache(saved.getId(), saved.getSlug(), null);
        return productDtoMapper.toResponse(saved, toppings, variants);
    }

    @Transactional
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

        String oldSlug = existing.getSlug();
        updated.setId(existing.getId());
        updated.setDeletedAt(existing.getDeletedAt());
        updated.setCreatedAt(existing.getCreatedAt());
        updated.setCreatedBy(existing.getCreatedBy());
        auditActorResolver.currentActorId().ifPresent(updated::setUpdatedBy);
        if (updated.getImageUrl() == null || updated.getImageUrl().isBlank()) {
            updated.setImageUrl(existing.getImageUrl());
        }

        Product saved = productRepository.save(updated);

        productToppingRepository.deleteByProductId(saved.getId());
        productToppingRepository.flush();
        List<Topping> toppings = toppingRepository.findActiveByIds(toppingIds);
        for (UUID toppingId : toppingIds) {
            productToppingRepository.save(ProductTopping.builder()
                    .id(null).productId(saved.getId()).toppingId(toppingId).build());
        }

        catalogImageStorageService.deleteIfChangedQuietly(existing.getImageUrl(), saved.getImageUrl());

        List<ProductVariant> variants = productVariantRepository.findActiveByProductId(saved.getId());
        evictProductCache(saved.getId(), saved.getSlug(), oldSlug);
        return productDtoMapper.toResponse(saved, toppings, variants);
    }

    public void deleteProduct(UUID productId) {
        Product existing = productRepository.findActiveById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));
        existing.setDeletedAt(LocalDateTime.now());
        auditActorResolver.currentActorId().ifPresent(existing::setUpdatedBy);
        productRepository.save(existing);
        evictProductCache(productId, existing.getSlug(), null);
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
        auditActorResolver.currentActorId().ifPresent(existing::setUpdatedBy);
        productRepository.save(existing);
        evictProductCache(productId, existing.getSlug(), null);
    }

    public ProductResponse getProductDetail(UUID productId) {
        ProductResponse cached = redisCacheService.get(CatalogCacheKeys.productById(productId), ProductResponse.class);
        if (cached != null) {
            return cached;
        }

        Product product = productRepository.findActiveById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        List<ProductTopping> productToppings = productToppingRepository.findByProductId(productId);
        List<UUID> toppingIds = productToppings.stream().map(ProductTopping::getToppingId).toList();

        List<Topping> toppings = toppingRepository.findActiveByIds(toppingIds);
        List<ProductVariant> variants = productVariantRepository.findActiveByProductId(productId);
        ProductResponse response = productDtoMapper.toResponse(product, toppings, variants);
        redisCacheService.set(CatalogCacheKeys.productById(productId), response);
        redisCacheService.set(CatalogCacheKeys.productBySlug(product.getSlug()), response);
        return response;
    }

    public ProductResponse getProductDetailBySlug(String rawSlug) {
        String slug = catalogSlugService.slugify(rawSlug);
        ProductResponse cached = redisCacheService.get(CatalogCacheKeys.productBySlug(slug), ProductResponse.class);
        if (cached != null) {
            return cached;
        }
        Product product = productRepository.findActiveBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "slug", slug));
        return getProductDetail(product.getId());
    }

    /** Trả về trang sản phẩm có filter và phân trang. Không cache list (filter quá đa dạng). */
    public Page<ProductResponse> pageProducts(
            UUID categoryId, Boolean isAvailable, Boolean isFeatured,
            String keyword, boolean includeDeleted, Pageable pageable) {

        Page<Product> page = productRepository.pageCatalog(
                categoryId, isAvailable, isFeatured, keyword, includeDeleted, pageable);

        List<UUID> ids = page.getContent().stream().map(Product::getId).toList();
        Map<UUID, List<ProductVariant>> variantMap = productVariantRepository.findActiveByProductIds(ids);

        List<ProductResponse> content = page.getContent().stream()
                .map(p -> assembleProductResponse(p, variantMap.getOrDefault(p.getId(), List.of())))
                .toList();

        return new PageImpl<>(content, page.getPageable(), page.getTotalElements());
    }

    /**
     * Suggest / autocomplete: chỉ trả id, name, slug, imageUrl, categoryId.
     * Không join variants / toppings → nhẹ, phù hợp gọi mỗi keystroke (kết hợp debounce ở FE).
     *
     * @param keyword từ khóa tìm kiếm (trên name + description)
     * @param size    số gợi ý tối đa, mặc định 8, tối đa 20
     */
    public List<ProductSuggestResponse> suggestProducts(String keyword, int size) {
        int safeSize = Math.min(Math.max(size, 1), 20);
        Pageable pageable = PageRequest.of(0, safeSize, Sort.by("displayOrder").ascending());
        Page<Product> page = productRepository.pageCatalog(
                null, Boolean.TRUE, null, keyword, false, pageable);
        return page.getContent().stream()
                .map(p -> ProductSuggestResponse.builder()
                        .id(p.getId())
                        .name(p.getName())
                        .slug(p.getSlug())
                        .imageUrl(p.getImageUrl())
                        .categoryId(p.getCategoryId())
                        .build())
                .toList();
    }

    @Transactional
    public void reorderProducts(List<ReorderItemRequest> items) {
        validateReorderInput(items);

        List<UUID> ids = items.stream().map(ReorderItemRequest::getId).toList();
        List<Product> products = productRepository.findAllActiveByIds(ids);

        if (products.size() != ids.size()) {
            Set<UUID> foundIds = products.stream().map(Product::getId).collect(Collectors.toSet());
            List<UUID> missing = ids.stream().filter(id -> !foundIds.contains(id)).toList();
            throw new ResourceNotFoundException("Product", "ids", missing);
        }

        Map<UUID, Integer> orderMap = items.stream()
                .collect(Collectors.toMap(ReorderItemRequest::getId, ReorderItemRequest::getDisplayOrder));

        var actor = auditActorResolver.currentActorId();
        for (Product p : products) {
            p.setDisplayOrder(orderMap.get(p.getId()).shortValue());
            actor.ifPresent(p::setUpdatedBy);
            productRepository.save(p);
        }

        for (Product p : products) {
            evictProductCache(p.getId(), p.getSlug(), null);
        }
    }

    private ProductResponse assembleProductResponse(Product product, List<ProductVariant> variants) {
        List<ProductTopping> productToppings = productToppingRepository.findByProductId(product.getId());
        List<UUID> toppingIds = productToppings.stream().map(ProductTopping::getToppingId).toList();
        List<Topping> toppings = toppingRepository.findActiveByIds(toppingIds);
        return productDtoMapper.toResponse(product, toppings, variants);
    }

    /**
     * Xóa cache theo id, slug mới, và (nếu slug đổi) slug cũ.
     * @param oldSlug slug trước khi update; null = không đổi slug / không cần xóa riêng
     */
    private void evictProductCache(UUID id, String currentSlug, String oldSlug) {
        redisCacheService.delete(CatalogCacheKeys.productById(id));
        redisCacheService.delete(CatalogCacheKeys.productBySlug(currentSlug));
        if (oldSlug != null && !oldSlug.equals(currentSlug)) {
            redisCacheService.delete(CatalogCacheKeys.productBySlug(oldSlug));
        }
    }

    private void validateReorderInput(List<ReorderItemRequest> items) {
        if (items == null || items.isEmpty()) {
            throw new BusinessException("Danh sách reorder không được rỗng.", "EMPTY_REORDER");
        }
        Set<Integer> orders = new HashSet<>();
        for (ReorderItemRequest item : items) {
            if (!orders.add(item.getDisplayOrder())) {
                throw new BusinessException(
                        "displayOrder trùng nhau trong danh sách reorder: " + item.getDisplayOrder(),
                        "DUPLICATE_DISPLAY_ORDER");
            }
        }
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
            Set<UUID> foundIds = found.stream().map(Topping::getId).collect(Collectors.toSet());
            List<UUID> missing = toppingIds.stream().filter(id -> !foundIds.contains(id)).toList();
            throw new ResourceNotFoundException(
                    "Topping không tồn tại hoặc đã bị xóa mềm (không còn active trong catalog): " + missing);
        }
    }

    private static List<UUID> normalizeToppingIds(List<UUID> raw) {
        if (raw == null || raw.isEmpty()) {
            return List.of();
        }
        return raw.stream().filter(Objects::nonNull).distinct().toList();
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
