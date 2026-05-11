package com.beverage.product.application.usecase;

import com.beverage.product.application.dto.request.CreateProductRequest;
import com.beverage.product.application.dto.request.UpdateProductRequest;
import com.beverage.product.application.dto.response.ProductResponse;
import com.beverage.product.application.mapper.ProductDtoMapper;
import com.beverage.product.domain.entity.Product;
import com.beverage.product.domain.entity.ProductTopping;
import com.beverage.product.domain.entity.Topping;
import com.beverage.product.domain.exception.ResourceNotFoundException;
import com.beverage.product.domain.repository.CategoryRepository;
import com.beverage.product.domain.repository.ProductRepository;
import com.beverage.product.domain.repository.ProductToppingRepository;
import com.beverage.product.domain.repository.ToppingRepository;
import com.beverage.product.infrastructure.cache.RedisCacheService;
import com.beverage.product.infrastructure.storage.CatalogImageStorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ProductUseCase {

    private static final String CACHE_PRODUCT_PREFIX = "cache:product:";

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ToppingRepository toppingRepository;
    private final ProductToppingRepository productToppingRepository;
    private final ProductDtoMapper productDtoMapper;
    private final RedisCacheService redisCacheService;
    private final CatalogImageStorageService catalogImageStorageService;

    public ProductResponse createProduct(@Valid CreateProductRequest request) {
        // Validate category exists
        categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));

        List<UUID> toppingIds = normalizeToppingIds(request.getToppingIds());
        validateToppingsExist(toppingIds);

        Product product = productDtoMapper.toDomainCreate(request);
        Product saved = productRepository.save(product);

        // Create product_toppings
        List<Topping> toppings = toppingRepository.findByIds(toppingIds);
        for (UUID toppingId : toppingIds) {
            ProductTopping pt = ProductTopping.builder()
                    .id(null)
                    .productId(saved.getId())
                    .toppingId(toppingId)
                    .build();
            productToppingRepository.save(pt);
        }

        redisCacheService.delete(getProductCacheKey(saved.getId()));
        return productDtoMapper.toResponse(saved, toppings);
    }

    public ProductResponse updateProduct(UUID productId, @Valid UpdateProductRequest request) {
        Product existing = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        // Validate category exists
        categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));

        List<UUID> toppingIds = normalizeToppingIds(request.getToppingIds());
        validateToppingsExist(toppingIds);

        Product updated = productDtoMapper.toDomainUpdate(request);
        updated.setId(existing.getId());
        if (updated.getImageUrl() == null || updated.getImageUrl().isBlank()) {
            updated.setImageUrl(existing.getImageUrl());
        }

        Product saved = productRepository.save(updated);

        // Replace product_toppings
        productToppingRepository.deleteByProductId(saved.getId());
        List<Topping> toppings = toppingRepository.findByIds(toppingIds);
        for (UUID toppingId : toppingIds) {
            ProductTopping pt = ProductTopping.builder()
                    .id(null)
                    .productId(saved.getId())
                    .toppingId(toppingId)
                    .build();
            productToppingRepository.save(pt);
        }

        catalogImageStorageService.deleteIfChangedQuietly(existing.getImageUrl(), saved.getImageUrl());

        redisCacheService.delete(getProductCacheKey(saved.getId()));
        return productDtoMapper.toResponse(saved, toppings);
    }

    public void deleteProduct(UUID productId) {
        Product existing = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        productToppingRepository.deleteByProductId(productId);
        productRepository.deleteById(productId);
        catalogImageStorageService.deleteIfChangedQuietly(existing.getImageUrl(), null);
        redisCacheService.delete(getProductCacheKey(productId));
    }

    public ProductResponse getProductDetail(UUID productId) {
        ProductResponse cached = redisCacheService.get(getProductCacheKey(productId), ProductResponse.class);
        if (cached != null) {
            return cached;
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        List<ProductTopping> productToppings = productToppingRepository.findByProductId(productId);
        List<UUID> toppingIds = productToppings.stream()
                .map(ProductTopping::getToppingId)
                .toList();

        List<Topping> toppings = toppingRepository.findByIds(toppingIds);
        ProductResponse response = productDtoMapper.toResponse(product, toppings);
        redisCacheService.set(getProductCacheKey(productId), response);
        return response;
    }

    public List<ProductResponse> listProducts(UUID categoryId, Boolean isAvailable, Boolean isFeatured) {
        List<Product> products = categoryId != null ? productRepository.findByCategoryId(categoryId) : productRepository.findAll();

        return products.stream()
                .filter(p -> isAvailable == null || Objects.equals(p.getIsAvailable(), isAvailable))
                .filter(p -> isFeatured == null || Objects.equals(p.getIsFeatured(), isFeatured))
                .map(this::assembleProductResponseWithoutExtraCategoryFetch)
                .toList();
    }

    private ProductResponse assembleProductResponseWithoutExtraCategoryFetch(Product product) {
        // For MVP: assemble toppings only (FE sẽ tự hiển thị theo response này)
        List<ProductTopping> productToppings = productToppingRepository.findByProductId(product.getId());
        List<UUID> toppingIds = productToppings.stream()
                .map(ProductTopping::getToppingId)
                .toList();
        List<Topping> toppings = toppingRepository.findByIds(toppingIds);
        return productDtoMapper.toResponse(product, toppings);
    }

    private void validateToppingsExist(List<UUID> toppingIds) {
        if (toppingIds == null || toppingIds.isEmpty()) return;

        List<Topping> found = toppingRepository.findByIds(toppingIds);
        if (found.size() != toppingIds.size()) {
            throw new ResourceNotFoundException("Topping", "ids", toppingIds);
        }
    }

    /** Giữ thứ tự, bỏ null, bỏ trùng — tránh vi phạm uk (product_id, topping_id) khi FE gửi trùng id. */
    private static List<UUID> normalizeToppingIds(List<UUID> raw) {
        if (raw == null || raw.isEmpty()) {
            return List.of();
        }
        return raw.stream().filter(Objects::nonNull).distinct().toList();
    }

    private String getProductCacheKey(UUID productId) {
        return CACHE_PRODUCT_PREFIX + productId;
    }
}

