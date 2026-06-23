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
    public ResponseEntity<ApiResponse<OrderInternalStatsResponse>> getStats(
            @org.springframework.web.bind.annotation.RequestParam(value = "date", required = false) String dateString
    ) {
        log.info("Internal request to fetch order dashboard stats for date={}", dateString);

        Instant start;
        Instant end;

        if (dateString == null || dateString.trim().isEmpty()) {
            start = ZonedDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"))
                    .truncatedTo(ChronoUnit.DAYS)
                    .toInstant();
            end = ZonedDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"))
                    .withHour(23).withMinute(59).withSecond(59).withNano(999999999)
                    .toInstant();
        } else if (dateString.trim().length() == 7) {
            try {
                java.time.YearMonth yearMonth = java.time.YearMonth.parse(dateString.trim());
                start = yearMonth.atDay(1).atStartOfDay(ZoneId.of("Asia/Ho_Chi_Minh")).toInstant();
                end = yearMonth.atEndOfMonth().atTime(23, 59, 59, 999999999).atZone(ZoneId.of("Asia/Ho_Chi_Minh")).toInstant();
            } catch (Exception e) {
                log.error("Failed to parse month string: {}, fallback to today", dateString);
                start = ZonedDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"))
                        .truncatedTo(ChronoUnit.DAYS)
                        .toInstant();
                end = ZonedDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"))
                        .withHour(23).withMinute(59).withSecond(59).withNano(999999999)
                        .toInstant();
            }
        } else {
            try {
                java.time.LocalDate localDate = java.time.LocalDate.parse(dateString.trim());
                start = localDate.atStartOfDay(ZoneId.of("Asia/Ho_Chi_Minh")).toInstant();
                end = localDate.atTime(23, 59, 59, 999999999).atZone(ZoneId.of("Asia/Ho_Chi_Minh")).toInstant();
            } catch (Exception e) {
                log.error("Failed to parse date string: {}, fallback to today", dateString);
                start = ZonedDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"))
                        .truncatedTo(ChronoUnit.DAYS)
                        .toInstant();
                end = ZonedDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"))
                        .withHour(23).withMinute(59).withSecond(59).withNano(999999999)
                        .toInstant();
            }
        }

        // 1. Total orders
        long totalOrders = orderJpaRepository.count();

        // 2. Today orders (in the target day) excluding CANCELLED
        long todayOrders = orderJpaRepository.countActiveOrdersBetween(start, end);

        // 3. Status counts in the target day
        List<Object[]> statusCountsRaw = orderJpaRepository.countOrdersByStatusBetween(start, end);
        Map<String, Long> statusCounts = new HashMap<>();
        for (Object[] row : statusCountsRaw) {
            if (row[0] != null) {
                statusCounts.put(row[0].toString(), (Long) row[1]);
            }
        }

        // 4. Top selling products in the target day
        List<TopProductDTO> topProducts = orderItemJpaRepository.findTopSellingProductsBetween(start, end, PageRequest.of(0, 5));

        OrderInternalStatsResponse responseData = OrderInternalStatsResponse.builder()
                .totalOrders(totalOrders)
                .todayOrders(todayOrders)
                .statusCounts(statusCounts)
                .topProducts(topProducts)
                .build();

        return ResponseEntity.ok(ApiResponse.success(responseData, "Lấy dữ liệu thống kê đơn hàng thành công"));
    }
}
