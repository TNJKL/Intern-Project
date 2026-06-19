package com.beverage.dashboard.infrastructure.client;

import com.beverage.dashboard.infrastructure.client.config.FeignClientConfig;
import com.beverage.dashboard.infrastructure.client.dto.PaymentInternalStatsResponse;
import com.beverage.dashboard.infrastructure.client.dto.shared.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

@FeignClient(
        name = "payment-service",
        url = "${app.payment-service.url:http://localhost:8085}",
        configuration = FeignClientConfig.class
)
public interface PaymentClient {

    @GetMapping("/api/v1/internal/payments/stats")
    ApiResponse<PaymentInternalStatsResponse> getStats();
}
