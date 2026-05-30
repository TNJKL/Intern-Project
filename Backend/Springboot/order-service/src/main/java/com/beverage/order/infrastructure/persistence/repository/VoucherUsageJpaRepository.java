package com.beverage.order.infrastructure.persistence.repository;

import com.beverage.order.infrastructure.persistence.entity.VoucherUsageEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface VoucherUsageJpaRepository extends JpaRepository<VoucherUsageEntity, UUID> {

    @Query("""
        SELECT COUNT(vu) FROM VoucherUsageEntity vu
        WHERE vu.voucherId = :voucherId
          AND (
            (:userId IS NOT NULL AND vu.userId = :userId)
            OR
            (:userEmail IS NOT NULL AND vu.userEmail = :userEmail)
          )
    """)
    long countByVoucherIdAndUser(@Param("voucherId") UUID voucherId,
                                 @Param("userId") UUID userId,
                                 @Param("userEmail") String userEmail);

    void deleteByOrderId(UUID orderId);
}
