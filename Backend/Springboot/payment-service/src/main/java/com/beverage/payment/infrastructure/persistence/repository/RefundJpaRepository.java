package com.beverage.payment.infrastructure.persistence.repository;

import com.beverage.payment.infrastructure.persistence.entity.RefundEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RefundJpaRepository extends JpaRepository<RefundEntity, UUID>, JpaSpecificationExecutor<RefundEntity> {
    List<RefundEntity> findByPaymentId(UUID paymentId);
    List<RefundEntity> findByOrderId(UUID orderId);

    @Query("SELECT SUM(r.amount) FROM RefundEntity r WHERE r.status = 'COMPLETED'")
    java.math.BigDecimal sumTotalRefunded();

    @Query("SELECT COUNT(r) FROM RefundEntity r WHERE r.status = 'COMPLETED'")
    long countTotalRefunds();
}
