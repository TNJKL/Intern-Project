package com.beverage.order.infrastructure.persistence.repository;

import com.beverage.order.infrastructure.persistence.entity.VoucherEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
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

    Page<VoucherEntity> findAll(Pageable pageable);

    boolean existsByCode(String code);
}
