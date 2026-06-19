package com.beverage.dashboard.infrastructure.client;

import com.beverage.dashboard.infrastructure.client.config.FeignClientConfig;
import com.beverage.dashboard.infrastructure.client.dto.InventoryInternalStatsResponse;
import com.beverage.dashboard.infrastructure.client.dto.shared.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

@FeignClient(
        name = "inventory-service",
        url = "${app.inventory-service.url:http://localhost:8084}",
        configuration = FeignClientConfig.class
)
public interface InventoryClient {

    @GetMapping("/api/v1/internal/inventory/stats")
    ApiResponse<InventoryInternalStatsResponse> getStats();
}
