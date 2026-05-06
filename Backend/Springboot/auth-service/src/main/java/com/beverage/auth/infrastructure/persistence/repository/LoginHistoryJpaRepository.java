package com.beverage.auth.infrastructure.persistence.repository;

import com.beverage.auth.infrastructure.persistence.entity.LoginHistoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LoginHistoryJpaRepository extends JpaRepository<LoginHistoryEntity, UUID> {
    List<LoginHistoryEntity> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
