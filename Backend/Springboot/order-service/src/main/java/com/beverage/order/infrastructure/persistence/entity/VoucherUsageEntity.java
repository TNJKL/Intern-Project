package com.beverage.order.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "voucher_usages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoucherUsageEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "voucher_id", nullable = false)
    private UUID voucherId;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "user_email")
    private String userEmail;

    @Column(name = "order_id", nullable = false)
    private UUID orderId;

    @Column(name = "used_at", nullable = false)
    private Instant usedAt;

    @PrePersist
    protected void onCreate() {
        if (usedAt == null) {
            usedAt = Instant.now();
        }
    }
}
