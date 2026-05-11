package com.beverage.auth.infrastructure.persistence.repository;

import com.beverage.auth.domain.entity.RefreshToken;
import com.beverage.auth.domain.repository.RefreshTokenRepository;
import com.beverage.auth.infrastructure.persistence.mapper.RefreshTokenMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class RefreshTokenRepositoryImpl implements RefreshTokenRepository {

    private final RefreshTokenJpaRepository refreshTokenJpaRepository;
    private final RefreshTokenMapper refreshTokenMapper;

    @Override
    public RefreshToken save(RefreshToken refreshToken) {
        return refreshTokenMapper.toDomain(refreshTokenJpaRepository.save(refreshTokenMapper.toEntity(refreshToken)));
    }

    @Override
    public Optional<RefreshToken> findById(UUID id) {
        return refreshTokenJpaRepository.findById(id).map(refreshTokenMapper::toDomain);
    }

    @Override
    public Optional<RefreshToken> findByTokenHash(String tokenHash) {
        return refreshTokenJpaRepository.findByTokenHash(tokenHash).map(refreshTokenMapper::toDomain);
    }

    @Override
    public void deleteById(UUID id) {
        refreshTokenJpaRepository.deleteById(id);
    }

    @Override
    public void deleteByUserId(UUID userId) {
        refreshTokenJpaRepository.deleteByUserId(userId);
    }
}
