package com.beverage.payment.infrastructure.persistence.repository;

import com.beverage.payment.infrastructure.persistence.entity.OutboxEventEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface OutboxEventRepository extends JpaRepository<OutboxEventEntity, UUID> {
    List<OutboxEventEntity> findByStatusOrderByCreatedAtAsc(String status);
    void deleteByStatusAndCreatedAtBefore(String status, Instant timestamp);
}
