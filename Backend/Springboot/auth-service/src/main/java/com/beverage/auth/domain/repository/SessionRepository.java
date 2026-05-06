package com.beverage.auth.domain.repository;

import com.beverage.auth.domain.entity.Session;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SessionRepository {
    Session save(Session session);
    Optional<Session> findById(UUID id);
    Optional<Session> findByTokenHash(String tokenHash);
    List<Session> findByUserId(UUID userId);
    void deleteById(UUID id);
    void deleteByUserId(UUID userId);
}
