package com.beverage.order.application.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderInternalStatsResponse {
    private Long totalOrders;
    private Long todayOrders;
    private Map<String, Long> statusCounts;
    private List<TopProductDTO> topProducts;
}
