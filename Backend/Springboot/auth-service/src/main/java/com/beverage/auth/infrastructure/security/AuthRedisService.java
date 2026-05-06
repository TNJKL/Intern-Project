package com.beverage.auth.infrastructure.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthRedisService {

    private final RedisTemplate<String, Object> redisTemplate;

    private static final String BLACKLIST_PREFIX = "blacklist:token:";
    private static final String BAN_PREFIX = "ban:user:";
    private static final String REFRESH_USED_PREFIX = "refresh:used:";
    private static final String SESSIONS_PREFIX = "sessions:";
    private static final String RATE_LIMIT_PREFIX = "ratelimit:";

    public void blacklistToken(String jti, long remainingTtlSeconds) {
        String key = BLACKLIST_PREFIX + jti;
        redisTemplate.opsForValue().set(key, "1", remainingTtlSeconds, TimeUnit.SECONDS);
        log.debug("Blacklisted token: {}", jti);
    }

    public boolean isTokenBlacklisted(String jti) {
        String key = BLACKLIST_PREFIX + jti;
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }

    public void banUser(UUID userId) {
        String key = BAN_PREFIX + userId;
        redisTemplate.opsForValue().set(key, "1");
        log.info("User banned: {}", userId);
    }

    public void unbanUser(UUID userId) {
        String key = BAN_PREFIX + userId;
        redisTemplate.delete(key);
        log.info("User unbanned: {}", userId);
    }

    public boolean isUserBanned(UUID userId) {
        String key = BAN_PREFIX + userId;
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }

    public void markRefreshTokenUsed(String jti, long ttlSeconds) {
        String key = REFRESH_USED_PREFIX + jti;
        redisTemplate.opsForValue().set(key, "1", ttlSeconds, TimeUnit.SECONDS);
        log.debug("Marked refresh token as used: {}", jti);
    }

    public boolean isRefreshTokenUsed(String jti) {
        String key = REFRESH_USED_PREFIX + jti;
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }

    public void addSessionToUser(UUID userId, String sessionId) {
        String key = SESSIONS_PREFIX + userId;
        redisTemplate.opsForSet().add(key, sessionId);
        log.debug("Added session {} to user {}", sessionId, userId);
    }

    public void removeSessionFromUser(UUID userId, String sessionId) {
        String key = SESSIONS_PREFIX + userId;
        redisTemplate.opsForSet().remove(key, sessionId);
        log.debug("Removed session {} from user {}", sessionId, userId);
    }

    public Set<Object> getUserSessions(UUID userId) {
        String key = SESSIONS_PREFIX + userId;
        return redisTemplate.opsForSet().members(key);
    }

    public void removeAllUserSessions(UUID userId) {
        String key = SESSIONS_PREFIX + userId;
        redisTemplate.delete(key);
        log.info("Removed all sessions for user: {}", userId);
    }

    public boolean isRateLimitExceeded(String scopeKey, long maxRequests, long windowSeconds) {
        String key = RATE_LIMIT_PREFIX + scopeKey;
        Long current = redisTemplate.opsForValue().increment(key);

        if (current == null) {
            return true;
        }

        if (current == 1) {
            redisTemplate.expire(key, windowSeconds, TimeUnit.SECONDS);
        }

        return current > maxRequests;
    }
}
