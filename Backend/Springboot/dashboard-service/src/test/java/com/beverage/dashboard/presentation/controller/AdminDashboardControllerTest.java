package com.beverage.dashboard.presentation.controller;

import com.beverage.dashboard.application.service.DashboardService;
import com.beverage.dashboard.infrastructure.security.JwtAuthenticationFilter;
import com.beverage.dashboard.presentation.dto.DashboardStatsResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.ArrayList;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminDashboardController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("AdminDashboardController Tests")
class AdminDashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DashboardService dashboardService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Test
    @DisplayName("Should return 200 OK with statistics when date parameter format is a valid day (yyyy-MM-dd)")
    void getStats_withValidDateDay_returnsSuccess() throws Exception {
        DashboardStatsResponse mockResponse = DashboardStatsResponse.builder()
                .topProducts(new ArrayList<>())
                .cachedAt(Instant.now())
                .build();

        when(dashboardService.getDashboardStats("2026-06-23")).thenReturn(mockResponse);

        mockMvc.perform(get("/api/v1/admin/dashboard/stats")
                        .param("date", "2026-06-23")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Lấy số liệu thống kê dashboard thành công"))
                .andExpect(jsonPath("$.data").exists());
    }

    @Test
    @DisplayName("Should return 200 OK with statistics when date parameter format is a valid month (yyyy-MM)")
    void getStats_withValidDateMonth_returnsSuccess() throws Exception {
        DashboardStatsResponse mockResponse = DashboardStatsResponse.builder()
                .topProducts(new ArrayList<>())
                .cachedAt(Instant.now())
                .build();

        when(dashboardService.getDashboardStats("2026-06")).thenReturn(mockResponse);

        mockMvc.perform(get("/api/v1/admin/dashboard/stats")
                        .param("date", "2026-06")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Lấy số liệu thống kê dashboard thành công"))
                .andExpect(jsonPath("$.data").exists());
    }

    @Test
    @DisplayName("Should return 400 Bad Request when date parameter format is invalid")
    void getStats_withInvalidDate_returnsBadRequest() throws Exception {
        mockMvc.perform(get("/api/v1/admin/dashboard/stats")
                        .param("date", "23-06-2026")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Định dạng ngày không hợp lệ. Vui lòng sử dụng định dạng yyyy-MM-dd (cho ngày) hoặc yyyy-MM (cho tháng)."))
                .andExpect(jsonPath("$.data").doesNotExist());

        mockMvc.perform(get("/api/v1/admin/dashboard/stats")
                        .param("date", "2026/06")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("Should return 200 OK with statistics when date parameter is empty or not provided")
    void getStats_withEmptyDate_returnsSuccess() throws Exception {
        DashboardStatsResponse mockResponse = DashboardStatsResponse.builder()
                .topProducts(new ArrayList<>())
                .cachedAt(Instant.now())
                .build();

        when(dashboardService.getDashboardStats(Mockito.isNull())).thenReturn(mockResponse);

        mockMvc.perform(get("/api/v1/admin/dashboard/stats")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Lấy số liệu thống kê dashboard thành công"));
    }
}
