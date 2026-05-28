package com.beverage.order.application.dto.response;

import com.beverage.order.domain.model.VoucherType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class VoucherResponse {

    private UUID id;
    private String code;
    private String name;
    private VoucherType discountType;
    private BigDecimal discountValue;
    private BigDecimal minOrderAmount;
    private BigDecimal maxDiscountAmount;
    private Integer maxUsageCount;
    private Integer maxUsagePerUser;
    private Integer currentUsageCount;
    private Instant validFrom;
    private Instant validUntil;
    private Boolean isActive;
    private String applicableTier;
    private Instant createdAt;
}
