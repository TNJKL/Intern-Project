package com.beverage.order.infrastructure.cache;

import com.beverage.order.infrastructure.client.dto.ProductCatalogDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductCacheService {

    private static final String KEY_PREFIX = "catalog:product:";

    private final RedisTemplate<String, Object> redisTemplate;

    @Value("${app.cache.product-ttl-seconds:300}")
    private long productTtlSeconds;

    public ProductCatalogDto.ProductData get(UUID productId) {
        String key = KEY_PREFIX + productId;
        try {
            Object cached = redisTemplate.opsForValue().get(key);
            if (cached instanceof ProductCatalogDto.ProductData data) {
                log.debug("Cache HIT for product: {}", productId);
                return data;
            }
        } catch (Exception e) {
            log.warn("Failed to get product cache {}: {}", productId, e.getMessage());
        }
        log.debug("Cache MISS for product: {}", productId);
        return null;
    }

    public void put(UUID productId, ProductCatalogDto.ProductData data) {
        String key = KEY_PREFIX + productId;
        try {
            redisTemplate.opsForValue().set(key, data, productTtlSeconds, TimeUnit.SECONDS);
            log.debug("Cached product {} with TTL {}s", productId, productTtlSeconds);
        } catch (Exception e) {
            log.warn("Failed to cache product {}: {}", productId, e.getMessage());
        }
    }

    public void evict(UUID productId) {
        String key = KEY_PREFIX + productId;
        try {
            redisTemplate.delete(key);
            log.debug("Evicted cache for product: {}", productId);
        } catch (Exception e) {
            log.warn("Failed to evict product cache {}: {}", productId, e.getMessage());
        }
    }
}
