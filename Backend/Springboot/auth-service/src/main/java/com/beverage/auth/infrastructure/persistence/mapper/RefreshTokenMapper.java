package com.beverage.auth.infrastructure.persistence.mapper;

import com.beverage.auth.domain.entity.RefreshToken;
import com.beverage.auth.infrastructure.persistence.entity.RefreshTokenEntity;
import org.springframework.stereotype.Component;

@Component
public class RefreshTokenMapper {

    public RefreshToken toDomain(RefreshTokenEntity entity) {
        if (entity == null) return null;
        return RefreshToken.builder()
                .id(entity.getId())
                .userId(entity.getUserId())
                .tokenHash(entity.getTokenHash())
                .expiresAt(entity.getExpiresAt())
                .isRevoked(entity.getIsRevoked())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    public RefreshTokenEntity toEntity(RefreshToken refreshToken) {
        if (refreshToken == null) return null;
        return RefreshTokenEntity.builder()
                .id(refreshToken.getId())
                .userId(refreshToken.getUserId())
                .tokenHash(refreshToken.getTokenHash())
                .expiresAt(refreshToken.getExpiresAt())
                .isRevoked(refreshToken.getIsRevoked())
                .createdAt(refreshToken.getCreatedAt())
                .build();
    }
}
