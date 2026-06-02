package com.beverage.inventory.infrastructure.cache;

import com.beverage.inventory.infrastructure.client.dto.ProductCatalogDto;
import com.beverage.inventory.infrastructure.client.dto.ToppingCatalogDto;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductCacheService {

    private static final String KEY_PREFIX = "catalog:product:";
    private static final String TOPPING_KEY_PREFIX = "catalog:topping:";

    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule());

    @Value("${app.cache.product-ttl-seconds:300}")
    private long productTtlSeconds;

    public ProductCatalogDto.ProductData get(UUID productId) {
        String key = KEY_PREFIX + productId;
        try {
            String json = stringRedisTemplate.opsForValue().get(key);
            if (json != null) {
                ProductCatalogDto.ProductData data = objectMapper.readValue(json, ProductCatalogDto.ProductData.class);
                log.debug("Cache HIT for product: {}", productId);
                return data;
            }
        } catch (JsonProcessingException e) {
            log.warn("Failed to deserialize product cache {}: {}", productId, e.getMessage());
        } catch (Exception e) {
            log.warn("Failed to get product cache {}: {}", productId, e.getMessage());
        }
        log.debug("Cache MISS for product: {}", productId);
        return null;
    }

    public void put(UUID productId, ProductCatalogDto.ProductData data) {
        String key = KEY_PREFIX + productId;
        try {
            String json = objectMapper.writeValueAsString(data);
            stringRedisTemplate.opsForValue().set(key, json, productTtlSeconds, TimeUnit.SECONDS);
            log.debug("Cached product {} with TTL {}s", productId, productTtlSeconds);
        } catch (Exception e) {
            log.warn("Failed to cache product {}: {}", productId, e.getMessage());
        }
    }

    public void evict(UUID productId) {
        String key = KEY_PREFIX + productId;
        try {
            stringRedisTemplate.delete(key);
            log.debug("Evicted cache for product: {}", productId);
        } catch (Exception e) {
            log.warn("Failed to evict product cache {}: {}", productId, e.getMessage());
        }
    }

    public ToppingCatalogDto.ToppingData getTopping(UUID toppingId) {
        String key = TOPPING_KEY_PREFIX + toppingId;
        try {
            String json = stringRedisTemplate.opsForValue().get(key);
            if (json != null) {
                ToppingCatalogDto.ToppingData data = objectMapper.readValue(json, ToppingCatalogDto.ToppingData.class);
                log.debug("Cache HIT for topping: {}", toppingId);
                return data;
            }
        } catch (JsonProcessingException e) {
            log.warn("Failed to deserialize topping cache {}: {}", toppingId, e.getMessage());
        } catch (Exception e) {
            log.warn("Failed to get topping cache {}: {}", toppingId, e.getMessage());
        }
        log.debug("Cache MISS for topping: {}", toppingId);
        return null;
    }

    public void putTopping(UUID toppingId, ToppingCatalogDto.ToppingData data) {
        String key = TOPPING_KEY_PREFIX + toppingId;
        try {
            String json = objectMapper.writeValueAsString(data);
            stringRedisTemplate.opsForValue().set(key, json, productTtlSeconds, TimeUnit.SECONDS);
            log.debug("Cached topping {} with TTL {}s", toppingId, productTtlSeconds);
        } catch (Exception e) {
            log.warn("Failed to cache topping {}: {}", toppingId, e.getMessage());
        }
    }

    public void evictTopping(UUID toppingId) {
        String key = TOPPING_KEY_PREFIX + toppingId;
        try {
            stringRedisTemplate.delete(key);
            log.debug("Evicted cache for topping: {}", toppingId);
        } catch (Exception e) {
            log.warn("Failed to evict topping cache {}: {}", toppingId, e.getMessage());
        }
    }
}
