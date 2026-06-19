package com.beverage.dashboard.infrastructure.security;

import com.beverage.shared.jwt.TokenSecurityStateService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthRedisService implements TokenSecurityStateService {

    private final RedisTemplate<String, Object> redisTemplate;

    private static final String BLACKLIST_PREFIX = "blacklist:token:";
    private static final String BAN_PREFIX = "ban:user:";

    @Override
    public boolean isTokenBlacklisted(String jti) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(BLACKLIST_PREFIX + jti));
    }

    @Override
    public boolean isUserBanned(UUID userId) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(BAN_PREFIX + userId));
    }
}
