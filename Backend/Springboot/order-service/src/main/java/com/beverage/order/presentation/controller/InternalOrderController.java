package com.beverage.order.presentation.controller;

import com.beverage.order.application.dto.response.OrderInternalStatsResponse;
import com.beverage.order.application.dto.response.TopProductDTO;
import com.beverage.order.common.ApiResponse;
import com.beverage.order.infrastructure.persistence.repository.OrderItemJpaRepository;
import com.beverage.order.infrastructure.persistence.repository.OrderJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/internal/orders")
@RequiredArgsConstructor
@Slf4j
public class InternalOrderController {

    private final OrderJpaRepository orderJpaRepository;
    private final OrderItemJpaRepository orderItemJpaRepository;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<OrderInternalStatsResponse>> getStats() {
        log.info("Internal request to fetch order dashboard stats");

        // 1. Total orders
        long totalOrders = orderJpaRepository.count();

        // 2. Today orders (since 00:00:00 Asia/Ho_Chi_Minh)
        Instant todayStart = ZonedDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"))
                .truncatedTo(ChronoUnit.DAYS)
                .toInstant();
        long todayOrders = orderJpaRepository.countByCreatedAtAfter(todayStart);

        // 3. Status counts
        List<Object[]> statusCountsRaw = orderJpaRepository.countOrdersByStatus();
        Map<String, Long> statusCounts = new HashMap<>();
        for (Object[] row : statusCountsRaw) {
            if (row[0] != null) {
                statusCounts.put(row[0].toString(), (Long) row[1]);
            }
        }

        // 4. Top selling products
        List<TopProductDTO> topProducts = orderItemJpaRepository.findTopSellingProducts(PageRequest.of(0, 5));

        OrderInternalStatsResponse responseData = OrderInternalStatsResponse.builder()
                .totalOrders(totalOrders)
                .todayOrders(todayOrders)
                .statusCounts(statusCounts)
                .topProducts(topProducts)
                .build();

        return ResponseEntity.ok(ApiResponse.success(responseData, "Lấy dữ liệu thống kê đơn hàng thành công"));
    }
}
