package com.beverage.auth.infrastructure.cache;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class RedisCacheService {

    private final RedisTemplate<String, Object> redisTemplate;

    private static final String USER_CACHE_PREFIX = "user:";
    private static final long DEFAULT_TTL_MINUTES = 30;

    public <T> void set(String key, T value) {
        set(key, value, DEFAULT_TTL_MINUTES, TimeUnit.MINUTES);
    }

    public <T> void set(String key, T value, long timeout, TimeUnit unit) {
        try {
            redisTemplate.opsForValue().set(key, value, timeout, unit);
            log.debug("Cached data with key: {}", key);
        } catch (Exception e) {
            log.error("Error caching data with key: {}", key, e);
        }
    }

    @SuppressWarnings("unchecked")
    public <T> T get(String key, Class<T> type) {
        try {
            Object value = redisTemplate.opsForValue().get(key);
            if (value != null && type.isInstance(value)) {
                log.debug("Cache hit for key: {}", key);
                return (T) value;
            }
        } catch (Exception e) {
            log.error("Error getting cached data with key: {}", key, e);
        }
        return null;
    }

    public void delete(String key) {
        try {
            redisTemplate.delete(key);
            log.debug("Deleted cache with key: {}", key);
        } catch (Exception e) {
            log.error("Error deleting cached data with key: {}", key, e);
        }
    }

    public void deleteByPattern(String pattern) {
        try {
            var keys = redisTemplate.keys(pattern);
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
                log.debug("Deleted {} keys matching pattern: {}", keys.size(), pattern);
            }
        } catch (Exception e) {
            log.error("Error deleting keys with pattern: {}", pattern, e);
        }
    }

    public String getUserCacheKey(String userId) {
        return USER_CACHE_PREFIX + userId;
    }

    public String getUserByEmailCacheKey(String email) {
        return USER_CACHE_PREFIX + "email:" + email;
    }
}
