package com.beverage.order.infrastructure.persistence.repository;

import com.beverage.order.domain.model.OrderStatus;
import com.beverage.order.infrastructure.persistence.entity.OrderEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderJpaRepository extends JpaRepository<OrderEntity, UUID>, JpaSpecificationExecutor<OrderEntity> {

    Optional<OrderEntity> findByIdAndUserId(UUID id, UUID userId);

    Optional<OrderEntity> findByOrderCode(String orderCode);

    @Query("SELECT o FROM OrderEntity o WHERE o.status = :status AND o.paymentDeadline < :now")
    List<OrderEntity> findExpiredOrdersByStatus(
            @Param("status") OrderStatus status,
            @Param("now") Instant now
    );

    default List<OrderEntity> findExpiredPendingOrders(Instant now) {
        return findExpiredOrdersByStatus(OrderStatus.PENDING, now);
    }

    long countByCreatedAtAfter(Instant start);

    @Query("SELECT o.status, COUNT(o) FROM OrderEntity o GROUP BY o.status")
    List<Object[]> countOrdersByStatus();
}
