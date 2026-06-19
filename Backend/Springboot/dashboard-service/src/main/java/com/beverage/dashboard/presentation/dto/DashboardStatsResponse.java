package com.beverage.dashboard.presentation.dto;

import com.beverage.dashboard.infrastructure.client.dto.InventoryInternalStatsResponse;
import com.beverage.dashboard.infrastructure.client.dto.OrderInternalStatsResponse;
import com.beverage.dashboard.infrastructure.client.dto.PaymentInternalStatsResponse;
import com.beverage.dashboard.infrastructure.client.dto.TopProductDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {
    private PaymentInternalStatsResponse revenue;
    private OrderInternalStatsResponse orders;
    private InventoryInternalStatsResponse inventory;
    private List<TopProductDTO> topProducts;
    private Instant cachedAt;
}
