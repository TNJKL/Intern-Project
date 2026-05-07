package com.beverage.product.infrastructure.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthRedisService {

    private final RedisTemplate<String, Object> redisTemplate;

    private static final String BLACKLIST_PREFIX = "blacklist:token:";
    private static final String BAN_PREFIX = "ban:user:";

    public boolean isTokenBlacklisted(String jti) {
        String key = BLACKLIST_PREFIX + jti;
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }

    public boolean isUserBanned(UUID userId) {
        String key = BAN_PREFIX + userId;
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }

    public void blacklistToken(String jti, long remainingTtlSeconds) {
        String key = BLACKLIST_PREFIX + jti;
        redisTemplate.opsForValue().set(key, "1", remainingTtlSeconds, TimeUnit.SECONDS);
        log.debug("Blacklisted token: {}", jti);
    }
}

