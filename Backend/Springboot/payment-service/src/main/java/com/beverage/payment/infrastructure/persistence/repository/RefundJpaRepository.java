package com.beverage.payment.infrastructure.persistence.repository;

import com.beverage.payment.infrastructure.persistence.entity.RefundEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

@Repository
public interface RefundJpaRepository extends JpaRepository<RefundEntity, UUID>, JpaSpecificationExecutor<RefundEntity> {
    List<RefundEntity> findByPaymentId(UUID paymentId);
    List<RefundEntity> findByOrderId(UUID orderId);

    @Query("SELECT SUM(r.amount) FROM RefundEntity r WHERE r.status = 'COMPLETED'")
    java.math.BigDecimal sumTotalRefunded();

    @Query("SELECT SUM(r.amount) FROM RefundEntity r WHERE r.status = 'COMPLETED' AND r.processedAt >= :start")
    java.math.BigDecimal sumRefundedAfter(@Param("start") java.time.Instant start);

    @Query("SELECT SUM(r.amount) FROM RefundEntity r WHERE r.status = 'COMPLETED' AND r.processedAt >= :start AND r.processedAt <= :end")
    java.math.BigDecimal sumRefundedBetween(@Param("start") java.time.Instant start, @Param("end") java.time.Instant end);

    @Query("SELECT COUNT(r) FROM RefundEntity r WHERE r.status = 'COMPLETED' AND r.processedAt >= :start")
    long countRefundsAfter(@Param("start") java.time.Instant start);

    @Query("SELECT COUNT(r) FROM RefundEntity r WHERE r.status = 'COMPLETED' AND r.processedAt >= :start AND r.processedAt <= :end")
    long countRefundsBetween(@Param("start") java.time.Instant start, @Param("end") java.time.Instant end);

    @Query("SELECT COUNT(r) FROM RefundEntity r WHERE r.status = 'COMPLETED'")
    long countTotalRefunds();
}
