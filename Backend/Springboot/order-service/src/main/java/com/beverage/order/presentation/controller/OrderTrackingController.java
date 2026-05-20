package com.beverage.order.presentation.controller;

import com.beverage.order.application.dto.response.OrderTrackingResponse;
import com.beverage.order.application.service.OrderTrackingService;
import com.beverage.order.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
@Tag(name = "Order Tracking", description = "Tra cứu đơn hàng (Public - cho Guest)")
@Slf4j
public class OrderTrackingController {

    private final OrderTrackingService orderTrackingService;

    @PostMapping("/track")
    @Operation(summary = "Tra cứu đơn hàng (Public - cho Guest)")
    public ResponseEntity<ApiResponse<OrderTrackingResponse>> trackOrder(
            @RequestParam @Size(max = 30) String code,
            @RequestParam @Size(max = 20) String phone,
            HttpServletRequest request
    ) {
        String clientIp = getClientIp(request);
        log.info("Tracking order request - code: {}, phone: ***, ip: {}", code, clientIp);

        OrderTrackingResponse tracking = orderTrackingService.trackOrder(code, phone, clientIp);
        return ResponseEntity.ok(ApiResponse.success(tracking, "Tra cứu đơn hàng thành công"));
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isBlank()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }
}
