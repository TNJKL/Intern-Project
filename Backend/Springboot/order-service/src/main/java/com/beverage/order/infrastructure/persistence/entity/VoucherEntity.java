package com.beverage.order.infrastructure.persistence.entity;

import com.beverage.order.domain.model.VoucherType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "vouchers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoucherEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false, length = 50)
    private String code;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false, length = 20)
    private VoucherType discountType;

    @Column(name = "discount_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal discountValue;

    @Column(name = "min_order_amount", nullable = false, precision = 12)
    private BigDecimal minOrderAmount;

    @Column(name = "max_discount_amount", precision = 12)
    private BigDecimal maxDiscountAmount;

    @Column(name = "max_usage_count")
    private Integer maxUsageCount;

    @Column(name = "current_usage_count", nullable = false)
    private Integer currentUsageCount;

    @Column(name = "valid_from", nullable = false)
    private Instant validFrom;

    @Column(name = "valid_until")
    private Instant validUntil;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @Column(name = "applicable_tier", nullable = false, length = 20)
    private String applicableTier = "ALL";

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
        if (currentUsageCount == null) currentUsageCount = 0;
        if (isActive == null) isActive = true;
        if (applicableTier == null) applicableTier = "ALL";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    public boolean isValid() {
        Instant now = Instant.now();
        if (!Boolean.TRUE.equals(isActive)) return false;
        if (now.isBefore(validFrom)) return false;
        if (validUntil != null && now.isAfter(validUntil)) return false;
        if (maxUsageCount != null && currentUsageCount >= maxUsageCount) return false;
        return true;
    }

    public boolean canApply(BigDecimal orderAmount) {
        if (!isValid()) return false;
        return orderAmount.compareTo(minOrderAmount) >= 0;
    }

    public BigDecimal calculateDiscount(BigDecimal orderAmount) {
        BigDecimal discount;
        if (discountType == VoucherType.PERCENTAGE) {
            discount = orderAmount.multiply(discountValue).divide(BigDecimal.valueOf(100));
            if (maxDiscountAmount != null && discount.compareTo(maxDiscountAmount) > 0) {
                discount = maxDiscountAmount;
            }
        } else {
            discount = discountValue;
            if (discount.compareTo(orderAmount) > 0) {
                discount = orderAmount;
            }
        }
        return discount.min(orderAmount);
    }

    public void incrementUsage() {
        this.currentUsageCount = (this.currentUsageCount == null ? 0 : this.currentUsageCount) + 1;
    }
}
