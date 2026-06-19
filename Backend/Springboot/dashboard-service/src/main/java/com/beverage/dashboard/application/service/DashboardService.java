package com.beverage.dashboard.application.service;

import com.beverage.dashboard.infrastructure.client.InventoryClient;
import com.beverage.dashboard.infrastructure.client.OrderClient;
import com.beverage.dashboard.infrastructure.client.PaymentClient;
import com.beverage.dashboard.infrastructure.client.dto.InventoryInternalStatsResponse;
import com.beverage.dashboard.infrastructure.client.dto.OrderInternalStatsResponse;
import com.beverage.dashboard.infrastructure.client.dto.PaymentInternalStatsResponse;
import com.beverage.dashboard.infrastructure.client.dto.TopProductDTO;
import com.beverage.dashboard.infrastructure.client.dto.shared.ApiResponse;
import com.beverage.dashboard.presentation.dto.DashboardStatsResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardService {

    private final OrderClient orderClient;
    private final PaymentClient paymentClient;
    private final InventoryClient inventoryClient;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    private static final String CACHE_KEY = "dashboard:stats:admin";

    @Value("${app.cache.dashboard-ttl-seconds:600}")
    private long cacheTtlSeconds;

    public DashboardStatsResponse getDashboardStats(boolean forceRefresh) {
        if (!forceRefresh) {
            try {
                Object cached = redisTemplate.opsForValue().get(CACHE_KEY);
                if (cached != null) {
                    DashboardStatsResponse cachedData = objectMapper.convertValue(cached, DashboardStatsResponse.class);
                    log.info("Dashboard stats fetched from Redis Cache (HIT)");
                    return cachedData;
                }
            } catch (Exception e) {
                log.warn("Failed to read dashboard stats from Redis cache: {}", e.getMessage());
            }
        }

        log.info("Fetching fresh dashboard stats from microservices (MISS or forceRefresh=true)");

        // Gọi song song 3 Feign Clients để tăng hiệu năng
        CompletableFuture<ApiResponse<OrderInternalStatsResponse>> orderFuture = CompletableFuture.supplyAsync(() -> {
            try {
                return orderClient.getStats();
            } catch (Exception e) {
                log.error("Failed to fetch stats from order-service: {}", e.getMessage());
                return ApiResponse.<OrderInternalStatsResponse>builder().success(false).build();
            }
        });

        CompletableFuture<ApiResponse<PaymentInternalStatsResponse>> paymentFuture = CompletableFuture.supplyAsync(() -> {
            try {
                return paymentClient.getStats();
            } catch (Exception e) {
                log.error("Failed to fetch stats from payment-service: {}", e.getMessage());
                return ApiResponse.<PaymentInternalStatsResponse>builder().success(false).build();
            }
        });

        CompletableFuture<ApiResponse<InventoryInternalStatsResponse>> inventoryFuture = CompletableFuture.supplyAsync(() -> {
            try {
                return inventoryClient.getStats();
            } catch (Exception e) {
                log.error("Failed to fetch stats from inventory-service: {}", e.getMessage());
                return ApiResponse.<InventoryInternalStatsResponse>builder().success(false).build();
            }
        });

        // Đợi tất cả hoàn thành
        CompletableFuture.allOf(orderFuture, paymentFuture, inventoryFuture).join();

        OrderInternalStatsResponse orderData = null;
        PaymentInternalStatsResponse paymentData = null;
        InventoryInternalStatsResponse inventoryData = null;
        List<TopProductDTO> topProducts = new ArrayList<>();

        try {
            ApiResponse<OrderInternalStatsResponse> orderRes = orderFuture.get();
            if (orderRes != null && orderRes.isSuccess() && orderRes.getData() != null) {
                orderData = orderRes.getData();
                if (orderData.getTopProducts() != null) {
                    topProducts = orderData.getTopProducts();
                }
            }
        } catch (Exception e) {
            log.error("Error retrieving order stats future result: {}", e.getMessage());
        }

        try {
            ApiResponse<PaymentInternalStatsResponse> paymentRes = paymentFuture.get();
            if (paymentRes != null && paymentRes.isSuccess() && paymentRes.getData() != null) {
                paymentData = paymentRes.getData();
            }
        } catch (Exception e) {
            log.error("Error retrieving payment stats future result: {}", e.getMessage());
        }

        try {
            ApiResponse<InventoryInternalStatsResponse> inventoryRes = inventoryFuture.get();
            if (inventoryRes != null && inventoryRes.isSuccess() && inventoryRes.getData() != null) {
                inventoryData = inventoryRes.getData();
            }
        } catch (Exception e) {
            log.error("Error retrieving inventory stats future result: {}", e.getMessage());
        }

        // Tạo payload gộp
        DashboardStatsResponse dashboardStats = DashboardStatsResponse.builder()
                .revenue(paymentData)
                .orders(orderData)
                .inventory(inventoryData)
                .topProducts(topProducts)
                .cachedAt(Instant.now())
                .build();

        // Ghi cache vào Redis
        try {
            redisTemplate.opsForValue().set(CACHE_KEY, dashboardStats, cacheTtlSeconds, TimeUnit.SECONDS);
            log.info("Saved dashboard stats to Redis cache with TTL {} seconds", cacheTtlSeconds);
        } catch (Exception e) {
            log.warn("Failed to save dashboard stats to Redis cache: {}", e.getMessage());
        }

        return dashboardStats;
    }
}
