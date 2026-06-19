package com.beverage.dashboard.infrastructure.client;

import com.beverage.dashboard.infrastructure.client.config.FeignClientConfig;
import com.beverage.dashboard.infrastructure.client.dto.OrderInternalStatsResponse;
import com.beverage.dashboard.infrastructure.client.dto.shared.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

@FeignClient(
        name = "order-service",
        url = "${app.order-service.url:http://localhost:8083}",
        configuration = FeignClientConfig.class
)
public interface OrderClient {

    @GetMapping("/api/v1/internal/orders/stats")
    ApiResponse<OrderInternalStatsResponse> getStats();
}
