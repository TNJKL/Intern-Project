package com.beverage.order.application.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserTierUpgradedEvent extends OrderEventWrapper {

    public static final String EVENT_TYPE = "TIER_UPGRADED";

    private UUID userId;
    private String userEmail;
    private String userName;
    private String tier;
    private BigDecimal totalSpent;
    private Integer totalOrders;

    @Override
    public String getEventType() {
        return EVENT_TYPE;
    }
}
