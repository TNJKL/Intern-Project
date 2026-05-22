package com.beverage.order.application.dto.response;

import com.beverage.order.domain.model.CustomerTier;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class CustomerTierResponse {

    private UUID userId;
    private CustomerTier tier;
    private BigDecimal totalSpent;
    private Integer totalOrders;
    private Instant tierUpdatedAt;
}
