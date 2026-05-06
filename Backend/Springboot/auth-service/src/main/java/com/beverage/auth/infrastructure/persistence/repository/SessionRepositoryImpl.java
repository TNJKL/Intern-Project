package com.beverage.auth.infrastructure.persistence.repository;

import com.beverage.auth.domain.entity.Session;
import com.beverage.auth.domain.repository.SessionRepository;
import com.beverage.auth.infrastructure.persistence.mapper.SessionMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class SessionRepositoryImpl implements SessionRepository {

    private final SessionJpaRepository sessionJpaRepository;
    private final SessionMapper sessionMapper;

    @Override
    public Session save(Session session) {
        return sessionMapper.toDomain(sessionJpaRepository.save(sessionMapper.toEntity(session)));
    }

    @Override
    public Optional<Session> findById(UUID id) {
        return sessionJpaRepository.findById(id).map(sessionMapper::toDomain);
    }

    @Override
    public Optional<Session> findByTokenHash(String tokenHash) {
        return sessionJpaRepository.findByTokenHash(tokenHash).map(sessionMapper::toDomain);
    }

    @Override
    public List<Session> findByUserId(UUID userId) {
        return sessionJpaRepository.findByUserId(userId).stream()
                .map(sessionMapper::toDomain)
                .toList();
    }

    @Override
    public void deleteById(UUID id) {
        sessionJpaRepository.deleteById(id);
    }

    @Override
    public void deleteByUserId(UUID userId) {
        sessionJpaRepository.deleteByUserId(userId);
    }
}
