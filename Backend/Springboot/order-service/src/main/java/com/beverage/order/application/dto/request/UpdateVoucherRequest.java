package com.beverage.order.application.dto.request;

import com.beverage.order.domain.model.VoucherType;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
public class UpdateVoucherRequest {

    @Size(max = 255)
    private String name;

    private VoucherType discountType;

    @DecimalMin(value = "0.01")
    private BigDecimal discountValue;

    @DecimalMin(value = "0")
    private BigDecimal minOrderAmount;

    private BigDecimal maxDiscountAmount;

    private Integer maxUsageCount;

    private Instant validFrom;

    private Instant validUntil;

    private Boolean isActive;
}
