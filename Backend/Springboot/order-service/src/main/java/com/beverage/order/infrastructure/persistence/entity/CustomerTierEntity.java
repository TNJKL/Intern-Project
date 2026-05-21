package com.beverage.order.infrastructure.persistence.entity;

import com.beverage.order.domain.model.CustomerTier;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "customer_tiers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerTierEntity {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CustomerTier tier;

    @Column(name = "total_spent", nullable = false, precision = 12)
    private BigDecimal totalSpent;

    @Column(name = "total_orders", nullable = false)
    private Integer totalOrders;

    @Column(name = "tier_updated_at", nullable = false)
    private Instant tierUpdatedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
        if (tierUpdatedAt == null) tierUpdatedAt = now;
        if (totalSpent == null) totalSpent = BigDecimal.ZERO;
        if (totalOrders == null) totalOrders = 0;
        if (tier == null) tier = CustomerTier.GUEST;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
