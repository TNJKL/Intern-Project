package com.beverage.order.infrastructure.persistence.repository;

import com.beverage.order.domain.model.CustomerTier;
import com.beverage.order.infrastructure.persistence.entity.CustomerTierEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CustomerTierJpaRepository extends JpaRepository<CustomerTierEntity, UUID> {

    List<CustomerTierEntity> findByTier(CustomerTier tier);

    @Query("SELECT COUNT(t) FROM CustomerTierEntity t WHERE t.tier = :tier")
    long countByTier(CustomerTier tier);
}
