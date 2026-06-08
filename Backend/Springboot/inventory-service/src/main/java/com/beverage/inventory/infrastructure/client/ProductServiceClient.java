package com.beverage.inventory.infrastructure.client;

import com.beverage.inventory.domain.exception.BusinessException;
import com.beverage.inventory.infrastructure.cache.ProductCacheService;
import com.beverage.inventory.infrastructure.client.dto.ProductCatalogDto;
import com.beverage.inventory.infrastructure.client.dto.ToppingCatalogDto;
import com.beverage.inventory.infrastructure.client.dto.ToppingListCatalogDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class ProductServiceClient {

    private final RestClient productRestClient;
    private final ProductCacheService productCacheService;

    public ProductCatalogDto.ProductData getProduct(UUID productId) {
        // 1. Check cache first
        ProductCatalogDto.ProductData cached = productCacheService.get(productId);
        if (cached != null) {
            return cached;
        }

        // 2. Cache miss → call Product-service
        try {
            ProductCatalogDto response = productRestClient.get()
                    .uri("/api/v1/products/{id}", productId)
                    .retrieve()
                    .body(ProductCatalogDto.class);

            if (response == null || response.getData() == null) {
                throw new BusinessException("Không tìm thấy sản phẩm có ID: " + productId);
            }

            // 3. Save to cache
            productCacheService.put(productId, response.getData());

            return response.getData();
        } catch (HttpClientErrorException.NotFound e) {
            throw new BusinessException("Không tìm thấy sản phẩm có ID: " + productId);
        } catch (HttpClientErrorException e) {
            log.warn("Product service HTTP {} for product {}", e.getStatusCode(), productId);
            throw new BusinessException("Không thể lấy thông tin sản phẩm từ catalog");
        } catch (Exception e) {
            log.error("Product service unavailable for {}: {}", productId, e.getMessage());
            throw new BusinessException("Dịch vụ sản phẩm tạm thời không khả dụng");
        }
    }

    public void evictCache(UUID productId) {
        productCacheService.evict(productId);
    }

    public ToppingCatalogDto.ToppingData getTopping(UUID toppingId) {
        // 1. Check cache first
        ToppingCatalogDto.ToppingData cached = productCacheService.getTopping(toppingId);
        if (cached != null) {
            return cached;
        }

        // 2. Cache miss → call Product-service
        try {
            ToppingCatalogDto response = productRestClient.get()
                    .uri("/api/v1/toppings/{id}", toppingId)
                    .retrieve()
                    .body(ToppingCatalogDto.class);

            if (response == null || response.getData() == null) {
                throw new BusinessException("Không tìm thấy topping có ID: " + toppingId);
            }

            // 3. Save to cache
            productCacheService.putTopping(toppingId, response.getData());

            return response.getData();
        } catch (HttpClientErrorException.NotFound e) {
            throw new BusinessException("Không tìm thấy topping có ID: " + toppingId);
        } catch (HttpClientErrorException e) {
            log.warn("Product service HTTP {} for topping {}", e.getStatusCode(), toppingId);
            throw new BusinessException("Không thể lấy thông tin topping từ catalog");
        } catch (Exception e) {
            log.error("Product service unavailable for topping {}: {}", toppingId, e.getMessage());
            throw new BusinessException("Dịch vụ sản phẩm tạm thời không khả dụng");
        }
    }

    public List<ToppingCatalogDto.ToppingData> getAllToppings() {
        try {
            ToppingListCatalogDto response = productRestClient.get()
                    .uri("/api/v1/toppings")
                    .retrieve()
                    .body(ToppingListCatalogDto.class);

            if (response == null || response.getData() == null) {
                return List.of();
            }

            return response.getData();
        } catch (Exception e) {
            log.error("Failed to retrieve all toppings from product-service: {}", e.getMessage());
            throw new BusinessException("Dịch vụ sản phẩm tạm thời không khả dụng");
        }
    }

    public void evictToppingCache(UUID toppingId) {
        productCacheService.evictTopping(toppingId);
    }
}
