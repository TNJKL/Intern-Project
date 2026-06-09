package com.beverage.inventory.infrastructure.persistence.repository;

import com.beverage.inventory.infrastructure.persistence.entity.ProcessedEventEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;

@Repository
public interface ProcessedEventJpaRepository extends JpaRepository<ProcessedEventEntity, String> {

    @Modifying
    @Query("DELETE FROM ProcessedEventEntity p WHERE p.processedAt < :time")
    int deleteOldEvents(@Param("time") Instant time);
}
