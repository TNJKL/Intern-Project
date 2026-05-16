package com.beverage.order.infrastructure.cache;

import com.beverage.order.application.dto.response.OrderDetailResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class OrderDetailCacheService {

    private static final String KEY_PREFIX = "order:detail:";

    private final RedisTemplate<String, Object> redisTemplate;

    @Value("${app.order-cache.detail-ttl-seconds:60}")
    private long detailTtlSeconds;

    public void put(UUID orderId, OrderDetailResponse detail) {
        redisTemplate.opsForValue().set(KEY_PREFIX + orderId, detail, detailTtlSeconds, TimeUnit.SECONDS);
    }

    public OrderDetailResponse get(UUID orderId) {
        Object cached = redisTemplate.opsForValue().get(KEY_PREFIX + orderId);
        if (cached instanceof OrderDetailResponse response) {
            return response;
        }
        return null;
    }

    public void evict(UUID orderId) {
        redisTemplate.delete(KEY_PREFIX + orderId);
    }
}
