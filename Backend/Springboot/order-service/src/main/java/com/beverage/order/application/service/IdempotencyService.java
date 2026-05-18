package com.beverage.order.application.service;

import com.beverage.order.domain.exception.IdempotencyException;
import com.beverage.order.infrastructure.persistence.entity.IdempotencyRecordEntity;
import com.beverage.order.infrastructure.persistence.repository.IdempotencyRecordJpaRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class IdempotencyService {

    private static final String REDIS_KEY_PREFIX = "idempotency:";

    private final RedisTemplate<String, Object> redisTemplate;
    private final IdempotencyRecordJpaRepository idempotencyRecordRepository;
    private final ObjectMapper objectMapper;

    @Value("${app.idempotency.ttl-hours:24}")
    private int ttlHours;

    public record IdempotencyEntry(String responseBody, int statusCode) {}

    public Optional<IdempotencyEntry> check(String idempotencyKey, String endpoint) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return Optional.empty();
        }

        String redisKey = REDIS_KEY_PREFIX + idempotencyKey;

        try {
            Object cached = redisTemplate.opsForValue().get(redisKey);
            if (cached != null) {
                log.info("Idempotency key '{}' found in Redis cache", idempotencyKey);
                if (cached instanceof String cachedJson) {
                    IdempotencyEntry entry = objectMapper.readValue(cachedJson, IdempotencyEntry.class);
                    return Optional.of(entry);
                }
            }
        } catch (Exception e) {
            log.warn("Failed to read idempotency key from Redis: {}", e.getMessage());
        }

        Optional<IdempotencyRecordEntity> dbRecord =
                idempotencyRecordRepository.findByIdempotencyKey(idempotencyKey);

        if (dbRecord.isPresent()) {
            IdempotencyRecordEntity record = dbRecord.get();

            if (record.getExpiresAt() != null && Instant.now().isAfter(record.getExpiresAt())) {
                log.info("Idempotency key '{}' expired, allowing new request", idempotencyKey);
                idempotencyRecordRepository.delete(record);
                return Optional.empty();
            }

            if (record.getResponseBody() != null) {
                log.info("Idempotency key '{}' found in DB, returning cached response", idempotencyKey);

                String json = toJson(new IdempotencyEntry(record.getResponseBody(), record.getStatusCode()));
                if (json != null) {
                    long remainingSeconds = Duration.between(Instant.now(), record.getExpiresAt()).getSeconds();
                    if (remainingSeconds > 0) {
                        try {
                            redisTemplate.opsForValue().set(redisKey, json, Duration.ofSeconds(remainingSeconds));
                        } catch (Exception e) {
                            log.warn("Failed to cache idempotency entry in Redis: {}", e.getMessage());
                        }
                    }
                }

                return Optional.of(new IdempotencyEntry(record.getResponseBody(), record.getStatusCode()));
            }
        }

        return Optional.empty();
    }

    public void save(String idempotencyKey, String endpoint, String requestHash, String responseBody, int statusCode) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return;
        }

        String redisKey = REDIS_KEY_PREFIX + idempotencyKey;

        try {
            IdempotencyEntry entry = new IdempotencyEntry(responseBody, statusCode);
            String json = objectMapper.writeValueAsString(entry);
            redisTemplate.opsForValue().set(redisKey, json, Duration.ofHours(ttlHours));
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize idempotency entry: {}", e.getMessage());
        }

        try {
            Instant expiresAt = Instant.now().plus(Duration.ofHours(ttlHours));

            idempotencyRecordRepository.findByIdempotencyKey(idempotencyKey)
                    .ifPresent(existing -> {
                        existing.setResponseBody(responseBody);
                        existing.setStatusCode(statusCode);
                        existing.setExpiresAt(expiresAt);
                        idempotencyRecordRepository.save(existing);
                    });

            if (idempotencyRecordRepository.findByIdempotencyKey(idempotencyKey).isEmpty()) {
                IdempotencyRecordEntity record = IdempotencyRecordEntity.builder()
                        .idempotencyKey(idempotencyKey)
                        .endpoint(endpoint)
                        .requestHash(requestHash)
                        .responseBody(responseBody)
                        .statusCode(statusCode)
                        .expiresAt(expiresAt)
                        .build();
                idempotencyRecordRepository.save(record);
            }

            log.info("Idempotency key '{}' saved with TTL {} hours", idempotencyKey, ttlHours);
        } catch (Exception e) {
            log.error("Failed to save idempotency record to DB: {}", e.getMessage());
        }
    }

    private String toJson(IdempotencyEntry entry) {
        try {
            return objectMapper.writeValueAsString(entry);
        } catch (JsonProcessingException e) {
            return null;
        }
    }
}
