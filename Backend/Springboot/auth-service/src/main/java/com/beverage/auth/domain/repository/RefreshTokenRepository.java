package com.beverage.auth.domain.repository;

import com.beverage.auth.domain.entity.RefreshToken;

import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository {
    RefreshToken save(RefreshToken refreshToken);
    Optional<RefreshToken> findById(UUID id);
    Optional<RefreshToken> findByTokenHash(String tokenHash);
    void deleteById(UUID id);
    void deleteByUserId(UUID userId);
}
