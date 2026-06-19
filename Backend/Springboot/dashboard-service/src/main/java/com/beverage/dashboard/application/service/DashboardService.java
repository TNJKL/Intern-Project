package com.beverage.dashboard.application.service;

import com.beverage.dashboard.infrastructure.client.StatsClientWrapper;
import com.beverage.dashboard.infrastructure.client.dto.InventoryInternalStatsResponse;
import com.beverage.dashboard.infrastructure.client.dto.OrderInternalStatsResponse;
import com.beverage.dashboard.infrastructure.client.dto.PaymentInternalStatsResponse;
import com.beverage.dashboard.infrastructure.client.dto.TopProductDTO;
import com.beverage.dashboard.infrastructure.client.dto.shared.ApiResponse;
import com.beverage.dashboard.presentation.dto.DashboardStatsResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class DashboardService {

    private final StatsClientWrapper statsClientWrapper;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;
    private final Executor dashboardExecutor;

    private static final String CACHE_KEY = "dashboard:stats:admin";

    @Value("${app.cache.dashboard-ttl-seconds:30}")
    private long cacheTtlSeconds;

    public DashboardService(
            StatsClientWrapper statsClientWrapper,
            RedisTemplate<String, Object> redisTemplate,
            ObjectMapper objectMapper,
            @Qualifier("dashboardExecutor") Executor dashboardExecutor) {
        this.statsClientWrapper = statsClientWrapper;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.dashboardExecutor = dashboardExecutor;
    }

    public DashboardStatsResponse getDashboardStats() {
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

        log.info("Fetching fresh dashboard stats from microservices (MISS)");

        // Gọi song song sử dụng custom thread pool (dashboardExecutor) và Circuit Breaker wrapper
        CompletableFuture<ApiResponse<OrderInternalStatsResponse>> orderFuture = CompletableFuture.supplyAsync(() -> {
            return statsClientWrapper.getOrderStats();
        }, dashboardExecutor);

        CompletableFuture<ApiResponse<PaymentInternalStatsResponse>> paymentFuture = CompletableFuture.supplyAsync(() -> {
            return statsClientWrapper.getPaymentStats();
        }, dashboardExecutor);

        CompletableFuture<ApiResponse<InventoryInternalStatsResponse>> inventoryFuture = CompletableFuture.supplyAsync(() -> {
            return statsClientWrapper.getInventoryStats();
        }, dashboardExecutor);

        // Đợi tất cả hoàn thành
        CompletableFuture.allOf(orderFuture, paymentFuture, inventoryFuture).join();

        OrderInternalStatsResponse orderData = null;
        PaymentInternalStatsResponse paymentData = null;
        InventoryInternalStatsResponse inventoryData = null;
        List<TopProductDTO> topProducts = new ArrayList<>();

        try {
            ApiResponse<OrderInternalStatsResponse> orderRes = orderFuture.get();
            if (orderRes != null && orderRes.getData() != null) {
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
            if (paymentRes != null && paymentRes.getData() != null) {
                paymentData = paymentRes.getData();
            }
        } catch (Exception e) {
            log.error("Error retrieving payment stats future result: {}", e.getMessage());
        }

        try {
            ApiResponse<InventoryInternalStatsResponse> inventoryRes = inventoryFuture.get();
            if (inventoryRes != null && inventoryRes.getData() != null) {
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
