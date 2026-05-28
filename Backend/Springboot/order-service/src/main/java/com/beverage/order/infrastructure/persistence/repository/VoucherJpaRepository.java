package com.beverage.order.infrastructure.persistence.repository;

import com.beverage.order.infrastructure.persistence.entity.VoucherEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VoucherJpaRepository extends JpaRepository<VoucherEntity, UUID> {

    Optional<VoucherEntity> findByCode(String code);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT v FROM VoucherEntity v WHERE v.code = :code")
    Optional<VoucherEntity> findByCodeForUpdate(@Param("code") String code);

    @Modifying
    @Query(value = """
        UPDATE vouchers
        SET current_usage_count = current_usage_count + 1,
            updated_at = NOW()
        WHERE code = :code
          AND is_active = TRUE
          AND (max_usage_count IS NULL OR current_usage_count < max_usage_count)
        """, nativeQuery = true)
    int tryIncrementUsage(@Param("code") String code);

    @Modifying
    @Query(value = """
        UPDATE vouchers
        SET current_usage_count = current_usage_count - 1,
            updated_at = NOW()
        WHERE id = :id
          AND is_active = TRUE
          AND current_usage_count > 0
        """, nativeQuery = true)
    int tryDecrementUsage(@Param("id") java.util.UUID id);

    Page<VoucherEntity> findAll(Pageable pageable);

    boolean existsByCode(String code);
}
