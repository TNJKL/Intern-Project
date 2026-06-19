package com.beverage.payment.infrastructure.persistence.repository;

import com.beverage.payment.domain.model.PaymentStatus;
import com.beverage.payment.infrastructure.persistence.entity.PaymentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentJpaRepository extends JpaRepository<PaymentEntity, UUID>, JpaSpecificationExecutor<PaymentEntity> {
    
    @Query("SELECT p FROM PaymentEntity p WHERE p.orderId = :orderId ORDER BY p.createdAt DESC LIMIT 1")
    Optional<PaymentEntity> findByOrderId(@Param("orderId") UUID orderId);

    List<PaymentEntity> findAllByOrderId(UUID orderId);

    Page<PaymentEntity> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    Optional<PaymentEntity> findByOrderCode(String orderCode);
    Optional<PaymentEntity> findByIdempotencyKey(String idempotencyKey);
    List<PaymentEntity> findAllByStatusAndExpiredAtBefore(PaymentStatus status, Instant now);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from PaymentEntity p where p.id = :id")
    Optional<PaymentEntity> findByIdWithLock(UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from PaymentEntity p where p.orderCode = :orderCode")
    Optional<PaymentEntity> findByOrderCodeWithLock(String orderCode);

    @Query("SELECT p FROM PaymentEntity p WHERE p.userId = :userId " +
           "AND p.paymentMethod = 'VNPAY' AND p.orderStatus = 'PENDING' " +
           "AND p.status IN :statuses ORDER BY p.createdAt DESC LIMIT 1")
    Optional<PaymentEntity> findActivePaymentByUserId(
            @Param("userId") UUID userId,
            @Param("statuses") List<PaymentStatus> statuses
    );

    @Query("SELECT p FROM PaymentEntity p WHERE p.orderCode = :orderCode " +
           "AND p.paymentMethod = 'VNPAY' AND p.orderStatus = 'PENDING' " +
           "AND p.status IN :statuses ORDER BY p.createdAt DESC LIMIT 1")
    Optional<PaymentEntity> findActivePaymentByOrderCode(
            @Param("orderCode") String orderCode,
            @Param("statuses") List<PaymentStatus> statuses
    );

    @Query("SELECT COUNT(p) FROM PaymentEntity p WHERE p.userId = :userId " +
           "AND p.paymentMethod = 'VNPAY' AND p.orderStatus = 'PENDING' " +
           "AND p.status IN :statuses AND p.retryCount < p.maxRetry")
    long countActivePaymentsByUserId(
            @Param("userId") UUID userId,
            @Param("statuses") List<PaymentStatus> statuses
    );

    @Query("SELECT COUNT(p) FROM PaymentEntity p WHERE p.orderCode = :orderCode " +
           "AND p.paymentMethod = 'VNPAY' AND p.orderStatus = 'PENDING' " +
           "AND p.status IN :statuses AND p.retryCount < p.maxRetry")
    long countActivePaymentsByOrderCode(
            @Param("orderCode") String orderCode,
            @Param("statuses") List<PaymentStatus> statuses
    );

    @Query("SELECT SUM(p.amount) FROM PaymentEntity p WHERE p.status = 'SUCCESS' OR p.status = 'REFUNDED'")
    java.math.BigDecimal sumTotalRevenue();

    @Query("SELECT SUM(p.amount) FROM PaymentEntity p WHERE (p.status = 'SUCCESS' OR p.status = 'REFUNDED') AND p.createdAt >= :start")
    java.math.BigDecimal sumRevenueAfter(@Param("start") Instant start);
}
