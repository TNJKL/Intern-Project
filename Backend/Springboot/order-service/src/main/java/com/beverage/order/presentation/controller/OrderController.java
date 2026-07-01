package com.beverage.order.presentation.controller;

import com.beverage.order.application.dto.request.CreateOrderRequest;
import com.beverage.order.application.dto.request.UpdateOrderStatusRequest;
import com.beverage.order.application.dto.response.OrderDetailResponse;
import com.beverage.order.application.dto.response.OrderSummaryResponse;
import com.beverage.order.application.dto.response.CustomerTierResponse;
import com.beverage.order.application.service.IdempotencyService;
import com.beverage.order.application.usecase.OrderUseCase;
import com.beverage.order.common.ApiResponse;
import com.beverage.order.domain.model.OrderStatus;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
@Tag(name = "Orders", description = "Đơn hàng của khách")
@Slf4j
public class OrderController {

    private final OrderUseCase orderUseCase;
    private final IdempotencyService idempotencyService;
    private final ObjectMapper objectMapper;

    @PostMapping
    @Operation(
            summary = "Tạo đơn hàng mới",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    public ResponseEntity<ApiResponse<OrderDetailResponse>> create(
            @Valid @RequestBody CreateOrderRequest request,
            @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey
    ) {
        String endpoint = "/api/v1/orders";

        Optional<IdempotencyService.IdempotencyEntry> cached =
                idempotencyService.check(idempotencyKey, endpoint);

        if (cached.isPresent()) {
            IdempotencyService.IdempotencyEntry entry = cached.get();
            try {
                OrderDetailResponse previousResponse = objectMapper.readValue(
                        entry.responseBody(), OrderDetailResponse.class);
                log.info("Returning cached response for idempotency key '{}'", idempotencyKey);
                return ResponseEntity.status(entry.statusCode())
                        .body(ApiResponse.success(previousResponse, "Đơn hàng đã được tạo (idempotent response)"));
            } catch (JsonProcessingException e) {
                log.warn("Failed to deserialize cached response for key '{}': {}", idempotencyKey, e.getMessage());
            }
        }

        OrderDetailResponse created = orderUseCase.createOrder(request);

        try {
            String responseJson = objectMapper.writeValueAsString(created);
            int statusCode = HttpStatus.CREATED.value();
            idempotencyService.save(idempotencyKey, endpoint, null, responseJson, statusCode);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize order response for idempotency key '{}': {}", idempotencyKey, e.getMessage());
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Tạo đơn hàng thành công"));
    }

    @GetMapping
    @Operation(
            summary = "Lịch sử đơn của tôi",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    public ResponseEntity<ApiResponse<List<OrderSummaryResponse>>> listMine(
            @RequestParam(required = false) OrderStatus status,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable
    ) {
        Page<OrderSummaryResponse> page = orderUseCase.listMyOrders(status, pageable);
        return ResponseEntity.ok(ApiResponse.paged(page.getContent(), "Lấy danh sách đơn thành công", page));
    }

    @GetMapping("/{id}")
    @Operation(
            summary = "Chi tiết đơn hàng",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    public ResponseEntity<ApiResponse<OrderDetailResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(orderUseCase.getOrderDetail(id), "Lấy chi tiết đơn thành công"));
    }

    @GetMapping("/code/{orderCode}")
    @Operation(
            summary = "Tìm đơn hàng bằng mã đơn",
            description = "Dùng khi khách tra mã ORD250518-xxx thay vì UUID"
    )
    public ResponseEntity<ApiResponse<OrderDetailResponse>> getByOrderCode(@PathVariable String orderCode) {
        return ResponseEntity.ok(ApiResponse.success(orderUseCase.getOrderDetailByCode(orderCode), "Lấy chi tiết đơn thành công"));
    }

    @PatchMapping("/{id}/status")
    @Operation(
            summary = "ADMIN - Cập nhật trạng thái đơn",
            security = @SecurityRequirement(name = "bearerAuth")
    )
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
    @Operation(
            summary = "Hủy đơn (chỉ PENDING)",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    public ResponseEntity<ApiResponse<OrderDetailResponse>> cancel(
            @PathVariable UUID id,
            @RequestBody(required = false) java.util.Map<String, String> body
    ) {
        String reason = (body != null && body.get("reason") != null && !body.get("reason").isBlank())
                ? body.get("reason")
                : "Khách hủy đơn";
        return ResponseEntity.ok(ApiResponse.success(orderUseCase.cancelOrder(id, reason), "Hủy đơn thành công"));
    }

    @PostMapping("/{id}/guest-cancel")
    @Operation(summary = "Khách vãng lai hủy đơn hàng (không cần token, xác thực qua SĐT)")
    public ResponseEntity<ApiResponse<OrderDetailResponse>> guestCancel(
            @PathVariable UUID id,
            @RequestBody java.util.Map<String, String> body
    ) {
        String phone = body != null ? body.get("phone") : null;
        if (phone == null || phone.isBlank()) {
            throw new com.beverage.order.domain.exception.BadRequestException("Số điện thoại không được bỏ trống");
        }
        String reason = (body != null && body.get("reason") != null && !body.get("reason").isBlank())
                ? body.get("reason")
                : "Khách vãng lai hủy đơn";
        return ResponseEntity.ok(ApiResponse.success(
                orderUseCase.guestCancelOrder(id, phone, reason),
                "Hủy đơn hàng thành công"
        ));
    }

    @GetMapping("/me/tier")
    @Operation(
            summary = "Lấy thông tin hạng thành viên và thống kê chi tiêu của tôi",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    public ResponseEntity<ApiResponse<CustomerTierResponse>> getMyTier() {
        return ResponseEntity.ok(ApiResponse.success(
                orderUseCase.getMyTierInfo(),
                "Lấy thông tin hạng thành viên thành công"
        ));
    }
}
