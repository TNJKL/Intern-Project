package com.beverage.order.presentation.controller;

import com.beverage.order.application.dto.response.OrderDetailResponse;
import com.beverage.order.application.dto.response.OrderSummaryResponse;
import com.beverage.order.application.usecase.OrderUseCase;
import com.beverage.order.common.ApiResponse;
import com.beverage.order.domain.model.OrderStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/orders")
@RequiredArgsConstructor
@Tag(name = "Admin Orders", description = "Quản trị đơn hàng")
@SecurityRequirement(name = "bearerAuth")
public class AdminOrderController {

    private final OrderUseCase orderUseCase;

    @GetMapping
    @Operation(
            summary = "ADMIN - Danh sách tất cả đơn, filter status/ngày/user",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    public ResponseEntity<ApiResponse<List<OrderSummaryResponse>>> listAll(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) String orderCode,
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant createdFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant createdTo,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable
    ) {
        Page<OrderSummaryResponse> page = orderUseCase.listAllOrders(
                status, orderCode, userId, createdFrom, createdTo, pageable
        );
        return ResponseEntity.ok(ApiResponse.paged(page.getContent(), "Lấy danh sách đơn admin thành công", page));
    }

    @GetMapping("/{id}")
    @Operation(
            summary = "ADMIN - Chi tiết đơn hàng",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    public ResponseEntity<ApiResponse<OrderDetailResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(orderUseCase.getOrderDetailForAdmin(id), "Lấy chi tiết đơn thành công"));
    }
}
