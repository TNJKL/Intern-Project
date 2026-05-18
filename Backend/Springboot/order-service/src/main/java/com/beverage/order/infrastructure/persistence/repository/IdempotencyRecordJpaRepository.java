package com.beverage.order.infrastructure.persistence.repository;

import com.beverage.order.infrastructure.persistence.entity.IdempotencyRecordEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface IdempotencyRecordJpaRepository extends JpaRepository<IdempotencyRecordEntity, UUID> {

    Optional<IdempotencyRecordEntity> findByIdempotencyKey(String idempotencyKey);

    boolean existsByIdempotencyKey(String idempotencyKey);
}
