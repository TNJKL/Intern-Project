package com.beverage.dashboard.infrastructure.client;

import com.beverage.dashboard.infrastructure.client.dto.InventoryInternalStatsResponse;
import com.beverage.dashboard.infrastructure.client.dto.OrderInternalStatsResponse;
import com.beverage.dashboard.infrastructure.client.dto.PaymentInternalStatsResponse;
import com.beverage.dashboard.infrastructure.client.dto.shared.ApiResponse;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Collections;

@Component
@RequiredArgsConstructor
@Slf4j
public class StatsClientWrapper {

    private final OrderClient orderClient;
    private final PaymentClient paymentClient;
    private final InventoryClient inventoryClient;

    @CircuitBreaker(name = "orderServiceCB", fallbackMethod = "fallbackOrderStats")
    public ApiResponse<OrderInternalStatsResponse> getOrderStats() {
        return orderClient.getStats();
    }

    public ApiResponse<OrderInternalStatsResponse> fallbackOrderStats(Throwable t) {
        log.warn("[Circuit Breaker] Dich vu order-service tam thoi dang khong hoat dong. Tra ve du lieu fallback trong. Chi tiet: {}", t.getMessage());
        
        OrderInternalStatsResponse fallbackData = new OrderInternalStatsResponse();
        fallbackData.setTotalOrders(0L);
        fallbackData.setTodayOrders(0L);
        fallbackData.setStatusCounts(Collections.emptyMap());
        fallbackData.setTopProducts(Collections.emptyList());

        return ApiResponse.<OrderInternalStatsResponse>builder()
                .success(false)
                .message("Dich vu order-service tam thoi dang khong hoat dong.")
                .data(fallbackData)
                .build();
    }

    @CircuitBreaker(name = "paymentServiceCB", fallbackMethod = "fallbackPaymentStats")
    public ApiResponse<PaymentInternalStatsResponse> getPaymentStats() {
        return paymentClient.getStats();
    }

    public ApiResponse<PaymentInternalStatsResponse> fallbackPaymentStats(Throwable t) {
        log.warn("[Circuit Breaker] Dich vu payment-service tam thoi dang khong hoat dong. Tra ve du lieu fallback trong. Chi tiet: {}", t.getMessage());
        
        PaymentInternalStatsResponse fallbackData = new PaymentInternalStatsResponse();
        fallbackData.setTotalRevenue(BigDecimal.ZERO);
        fallbackData.setTodayRevenue(BigDecimal.ZERO);
        fallbackData.setThisMonthRevenue(BigDecimal.ZERO);
        fallbackData.setRefundedAmount(BigDecimal.ZERO);
        fallbackData.setRefundCount(0L);

        return ApiResponse.<PaymentInternalStatsResponse>builder()
                .success(false)
                .message("Dich vu payment-service tam thoi dang khong hoat dong.")
                .data(fallbackData)
                .build();
    }

    @CircuitBreaker(name = "inventoryServiceCB", fallbackMethod = "fallbackInventoryStats")
    public ApiResponse<InventoryInternalStatsResponse> getInventoryStats() {
        return inventoryClient.getStats();
    }

    public ApiResponse<InventoryInternalStatsResponse> fallbackInventoryStats(Throwable t) {
        log.warn("[Circuit Breaker] Dich vu inventory-service tam thoi dang khong hoat dong. Tra ve du lieu fallback trong. Chi tiet: {}", t.getMessage());
        
        InventoryInternalStatsResponse fallbackData = new InventoryInternalStatsResponse();
        fallbackData.setLowStockCount(0L);
        fallbackData.setCriticalStockCount(0L);
        fallbackData.setAlertIngredients(Collections.emptyList());

        return ApiResponse.<InventoryInternalStatsResponse>builder()
                .success(false)
                .message("Dich vu inventory-service tam thoi dang khong hoat dong.")
                .data(fallbackData)
                .build();
    }
}
