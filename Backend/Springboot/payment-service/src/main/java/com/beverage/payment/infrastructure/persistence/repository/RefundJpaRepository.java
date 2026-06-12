package com.beverage.payment.infrastructure.persistence.repository;

import com.beverage.payment.infrastructure.persistence.entity.RefundEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RefundJpaRepository extends JpaRepository<RefundEntity, UUID>, JpaSpecificationExecutor<RefundEntity> {
    List<RefundEntity> findByPaymentId(UUID paymentId);
    List<RefundEntity> findByOrderId(UUID orderId);
}
