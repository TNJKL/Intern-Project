package com.beverage.order.infrastructure.persistence.repository;

import com.beverage.order.application.dto.response.TopProductDTO;
import com.beverage.order.infrastructure.persistence.entity.OrderItemEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrderItemJpaRepository extends JpaRepository<OrderItemEntity, UUID> {

    @Query("SELECT new com.beverage.order.application.dto.response.TopProductDTO(oi.productId, oi.productName, SUM(oi.quantity)) " +
           "FROM OrderItemEntity oi " +
           "INNER JOIN oi.order o " +
           "WHERE o.status = 'COMPLETED' " +
           "GROUP BY oi.productId, oi.productName " +
           "ORDER BY SUM(oi.quantity) DESC")
    List<TopProductDTO> findTopSellingProducts(Pageable pageable);
}
