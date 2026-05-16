package com.beverage.order.presentation.controller;

import com.beverage.order.application.dto.request.CreateOrderRequest;
import com.beverage.order.application.dto.request.UpdateOrderStatusRequest;
import com.beverage.order.application.dto.response.OrderDetailResponse;
import com.beverage.order.application.dto.response.OrderSummaryResponse;
import com.beverage.order.application.usecase.OrderUseCase;
import com.beverage.order.common.ApiResponse;
import com.beverage.order.domain.model.OrderStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
@Tag(name = "Orders", description = "Đơn hàng của khách")
public class OrderController {

    private final OrderUseCase orderUseCase;

    @PostMapping
    @Operation(summary = "Tạo đơn hàng mới")
    public ResponseEntity<ApiResponse<OrderDetailResponse>> create(@Valid @RequestBody CreateOrderRequest request) {
        OrderDetailResponse created = orderUseCase.createOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Tạo đơn hàng thành công"));
    }

    @GetMapping
    @Operation(summary = "Lịch sử đơn của tôi")
    public ResponseEntity<ApiResponse<List<OrderSummaryResponse>>> listMine(
            @RequestParam(required = false) OrderStatus status,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable
    ) {
        Page<OrderSummaryResponse> page = orderUseCase.listMyOrders(status, pageable);
        return ResponseEntity.ok(ApiResponse.paged(page.getContent(), "Lấy danh sách đơn thành công", page));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết đơn hàng")
    public ResponseEntity<ApiResponse<OrderDetailResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(orderUseCase.getOrderDetail(id), "Lấy chi tiết đơn thành công"));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "ADMIN - Cập nhật trạng thái đơn")
    public ResponseEntity<ApiResponse<OrderDetailResponse>> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateOrderStatusRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                orderUseCase.updateStatus(id, request),
                "Cập nhật trạng thái thành công"
        ));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Hủy đơn (chỉ PENDING)")
    public ResponseEntity<ApiResponse<OrderDetailResponse>> cancel(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(orderUseCase.cancelOrder(id), "Hủy đơn thành công"));
    }
}
