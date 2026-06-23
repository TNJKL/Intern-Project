package com.beverage.dashboard.application.service;

import com.beverage.dashboard.infrastructure.client.StatsClientWrapper;
import com.beverage.dashboard.infrastructure.client.dto.*;
import com.beverage.dashboard.infrastructure.client.dto.shared.ApiResponse;
import com.beverage.dashboard.presentation.dto.DashboardStatsResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.concurrent.Executor;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("DashboardService Tests")
class DashboardServiceTest {

    @Mock
    private StatsClientWrapper statsClientWrapper;

    @Mock
    private RedisTemplate<String, Object> redisTemplate;

    @Mock
    private ValueOperations<String, Object> valueOperations;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Executor dashboardExecutor = Runnable::run; // Executes tasks synchronously

    private DashboardService dashboardService;

    @BeforeEach
    void setUp() throws Exception {
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        dashboardService = new DashboardService(
                statsClientWrapper,
                redisTemplate,
                objectMapper,
                dashboardExecutor
        );
        // Inject cacheTtlSeconds via reflection since it's a private field and we're not running in a Spring context
        java.lang.reflect.Field field = DashboardService.class.getDeclaredField("cacheTtlSeconds");
        field.setAccessible(true);
        field.set(dashboardService, 30L);
    }

    @Test
    @DisplayName("Should return cached dashboard stats directly when Redis cache hits")
    void getDashboardStats_cacheHit_returnsCachedData() {
        String date = "2026-06-23";
        String cacheKey = "dashboard:stats:admin:" + date;

        DashboardStatsResponse cachedResponse = DashboardStatsResponse.builder()
                .revenue(new PaymentInternalStatsResponse())
                .orders(new OrderInternalStatsResponse())
                .inventory(new InventoryInternalStatsResponse())
                .topProducts(new ArrayList<>())
                .build();

        // Mock redis hit
        when(valueOperations.get(cacheKey)).thenReturn(cachedResponse);

        DashboardStatsResponse result = dashboardService.getDashboardStats(date);

        assertNotNull(result);
        verify(valueOperations, times(1)).get(cacheKey);
        verifyNoInteractions(statsClientWrapper);
    }

    @Test
    @DisplayName("Should fetch statistics from microservices, aggregate, cache and return when Redis cache misses")
    void getDashboardStats_cacheMiss_callsMicroservicesAndCaches() {
        String date = "2026-06-23";
        String cacheKey = "dashboard:stats:admin:" + date;

        when(valueOperations.get(cacheKey)).thenReturn(null);

        // Mock Order stats response
        OrderInternalStatsResponse orderStats = OrderInternalStatsResponse.builder()
                .totalOrders(100L)
                .todayOrders(10L)
                .statusCounts(Map.of("COMPLETED", 90L))
                .topProducts(List.of(new TopProductDTO(UUID.randomUUID(), "Mocha Cafe", 50L)))
                .build();
        when(statsClientWrapper.getOrderStats(date)).thenReturn(ApiResponse.<OrderInternalStatsResponse>builder().success(true).message("Success").data(orderStats).build());

        // Mock Payment stats response
        PaymentInternalStatsResponse paymentStats = PaymentInternalStatsResponse.builder()
                .totalRevenue(new BigDecimal("15000000"))
                .todayRevenue(new BigDecimal("1500000"))
                .thisMonthRevenue(new BigDecimal("15000000"))
                .build();
        when(statsClientWrapper.getPaymentStats(date)).thenReturn(ApiResponse.<PaymentInternalStatsResponse>builder().success(true).message("Success").data(paymentStats).build());

        // Mock Inventory stats response
        InventoryInternalStatsResponse inventoryStats = InventoryInternalStatsResponse.builder()
                .lowStockCount(2L)
                .criticalStockCount(1L)
                .alertIngredients(new ArrayList<>())
                .build();
        when(statsClientWrapper.getInventoryStats()).thenReturn(ApiResponse.<InventoryInternalStatsResponse>builder().success(true).message("Success").data(inventoryStats).build());

        DashboardStatsResponse result = dashboardService.getDashboardStats(date);

        assertNotNull(result);
        assertEquals(new BigDecimal("15000000"), result.getRevenue().getTotalRevenue());
        assertEquals(100L, result.getOrders().getTotalOrders());
        assertEquals(2L, result.getInventory().getLowStockCount());
        assertEquals(1, result.getTopProducts().size());
        assertEquals("Mocha Cafe", result.getTopProducts().get(0).getProductName());

        verify(statsClientWrapper, times(1)).getOrderStats(date);
        verify(statsClientWrapper, times(1)).getPaymentStats(date);
        verify(statsClientWrapper, times(1)).getInventoryStats();
        // Since 2026-06-23 is dynamic, the test target date might equal or not equal today. 
        // We verify that set cache was invoked with any dynamic TTL (seconds)
        verify(valueOperations, times(1)).set(eq(cacheKey), any(DashboardStatsResponse.class), anyLong(), eq(TimeUnit.SECONDS));
    }

    @Test
    @DisplayName("Should default to today's date in Vietnam timezone when date parameter is null")
    void getDashboardStats_withNullDate_defaultsToToday() {
        String todayVnStr = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")).toString();
        String cacheKey = "dashboard:stats:admin:" + todayVnStr;

        when(valueOperations.get(cacheKey)).thenReturn(null);

        // Stub statsClientWrapper calls
        when(statsClientWrapper.getOrderStats(todayVnStr)).thenReturn(ApiResponse.<OrderInternalStatsResponse>builder().success(true).message("").data(new OrderInternalStatsResponse()).build());
        when(statsClientWrapper.getPaymentStats(todayVnStr)).thenReturn(ApiResponse.<PaymentInternalStatsResponse>builder().success(true).message("").data(new PaymentInternalStatsResponse()).build());
        when(statsClientWrapper.getInventoryStats()).thenReturn(ApiResponse.<InventoryInternalStatsResponse>builder().success(true).message("").data(new InventoryInternalStatsResponse()).build());

        DashboardStatsResponse result = dashboardService.getDashboardStats(null);

        assertNotNull(result);
        verify(statsClientWrapper, times(1)).getOrderStats(todayVnStr);
        verify(statsClientWrapper, times(1)).getPaymentStats(todayVnStr);
        verify(valueOperations, times(1)).set(eq(cacheKey), any(DashboardStatsResponse.class), eq(30L), eq(TimeUnit.SECONDS)); // TTL 30s for today
    }

    @Test
    @DisplayName("Should use a longer cache TTL (600s) when requesting historical dates")
    void getDashboardStats_withHistoricalPeriod_savesCacheWithLongerTtl() {
        String historicalDate = "2024-05-15";
        String cacheKey = "dashboard:stats:admin:" + historicalDate;

        when(valueOperations.get(cacheKey)).thenReturn(null);

        // Stub statsClientWrapper calls
        when(statsClientWrapper.getOrderStats(historicalDate)).thenReturn(ApiResponse.<OrderInternalStatsResponse>builder().success(true).message("").data(new OrderInternalStatsResponse()).build());
        when(statsClientWrapper.getPaymentStats(historicalDate)).thenReturn(ApiResponse.<PaymentInternalStatsResponse>builder().success(true).message("").data(new PaymentInternalStatsResponse()).build());
        when(statsClientWrapper.getInventoryStats()).thenReturn(ApiResponse.<InventoryInternalStatsResponse>builder().success(true).message("").data(new InventoryInternalStatsResponse()).build());

        DashboardStatsResponse result = dashboardService.getDashboardStats(historicalDate);

        assertNotNull(result);
        verify(statsClientWrapper, times(1)).getOrderStats(historicalDate);
        verify(statsClientWrapper, times(1)).getPaymentStats(historicalDate);
        verify(valueOperations, times(1)).set(eq(cacheKey), any(DashboardStatsResponse.class), eq(600L), eq(TimeUnit.SECONDS)); // TTL 600s for history
    }
}
