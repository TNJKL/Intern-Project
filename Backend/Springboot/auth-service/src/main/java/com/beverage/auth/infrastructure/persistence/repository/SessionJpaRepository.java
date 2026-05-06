package com.beverage.auth.infrastructure.persistence.repository;

import com.beverage.auth.infrastructure.persistence.entity.SessionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SessionJpaRepository extends JpaRepository<SessionEntity, UUID> {
    Optional<SessionEntity> findByTokenHash(String tokenHash);
    List<SessionEntity> findByUserId(UUID userId);
    void deleteByUserId(UUID userId);
}
