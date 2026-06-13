package com.beverage.payment.infrastructure.persistence.repository;

import com.beverage.payment.domain.model.PaymentStatus;
import com.beverage.payment.infrastructure.persistence.entity.PaymentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import jakarta.persistence.LockModeType;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentJpaRepository extends JpaRepository<PaymentEntity, UUID>, JpaSpecificationExecutor<PaymentEntity> {
    Optional<PaymentEntity> findByOrderId(UUID orderId);
    Optional<PaymentEntity> findByOrderCode(String orderCode);
    Optional<PaymentEntity> findByIdempotencyKey(String idempotencyKey);
    List<PaymentEntity> findAllByStatusAndExpiredAtBefore(PaymentStatus status, Instant now);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from PaymentEntity p where p.id = :id")
    Optional<PaymentEntity> findByIdWithLock(UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from PaymentEntity p where p.orderCode = :orderCode")
    Optional<PaymentEntity> findByOrderCodeWithLock(String orderCode);
}
