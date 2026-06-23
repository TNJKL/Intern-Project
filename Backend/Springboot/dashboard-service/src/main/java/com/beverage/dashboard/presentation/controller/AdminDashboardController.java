package com.beverage.dashboard.presentation.controller;

import com.beverage.dashboard.application.service.DashboardService;
import com.beverage.dashboard.common.ApiResponse;
import com.beverage.dashboard.presentation.dto.DashboardStatsResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
@RequiredArgsConstructor
@Slf4j
public class AdminDashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getStats(
            @RequestParam(value = "date", required = false) String date
    ) {
        log.info("Admin request to get dashboard stats for date={}", date);
        if (date != null && !date.trim().isEmpty()) {
            String trimmedDate = date.trim();
            boolean isValid = false;
            if (trimmedDate.length() == 7) {
                try {
                    java.time.YearMonth.parse(trimmedDate);
                    isValid = true;
                } catch (java.time.format.DateTimeParseException ignored) {}
            } else if (trimmedDate.length() == 10) {
                try {
                    java.time.LocalDate.parse(trimmedDate);
                    isValid = true;
                } catch (java.time.format.DateTimeParseException ignored) {}
            }
            if (!isValid) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Định dạng ngày không hợp lệ. Vui lòng sử dụng định dạng yyyy-MM-dd (cho ngày) hoặc yyyy-MM (cho tháng)."));
            }
        }
        DashboardStatsResponse stats = dashboardService.getDashboardStats(date);
        return ResponseEntity.ok(ApiResponse.success(stats, "Lấy số liệu thống kê dashboard thành công"));
    }
}
