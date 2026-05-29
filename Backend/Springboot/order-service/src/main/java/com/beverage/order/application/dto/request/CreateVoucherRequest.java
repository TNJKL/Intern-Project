package com.beverage.order.application.dto.request;

import com.beverage.order.domain.model.VoucherType;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
public class CreateVoucherRequest {

    @NotBlank
    @Size(max = 50)
    private String code;

    @NotBlank
    @Size(max = 255)
    private String name;

    @NotNull
    private VoucherType discountType;

    @NotNull
    @DecimalMin(value = "0.01")
    private BigDecimal discountValue;

    @DecimalMin(value = "0")
    private BigDecimal minOrderAmount;

    private BigDecimal maxDiscountAmount;

    private Integer maxUsageCount;

    @Min(value = 1, message = "maxUsagePerUser must be at least 1")
    private Integer maxUsagePerUser;

    private Instant validFrom;

    private Instant validUntil;

    private Boolean isActive = true;

    @Pattern(regexp = "^(ALL|MEMBER|VIP)$", message = "applicableTier must be ALL, MEMBER, or VIP")
    private String applicableTier;
}
