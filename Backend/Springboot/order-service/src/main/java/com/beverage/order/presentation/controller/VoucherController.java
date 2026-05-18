package com.beverage.order.presentation.controller;

import com.beverage.order.application.dto.request.CreateVoucherRequest;
import com.beverage.order.application.dto.request.UpdateVoucherRequest;
import com.beverage.order.application.dto.response.VoucherResponse;
import com.beverage.order.application.dto.response.VoucherValidationResponse;
import com.beverage.order.application.service.VoucherService;
import com.beverage.order.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Vouchers", description = "Quản lý voucher")
public class VoucherController {

    private final VoucherService voucherService;

    @GetMapping("/vouchers/validate/{code}")
    @Operation(
            summary = "Validate voucher - Kiểm tra mã voucher",
            description = "Public endpoint để validate voucher với số tiền đơn hàng"
    )
    public ResponseEntity<ApiResponse<VoucherValidationResponse>> validate(
            @PathVariable String code,
            @RequestParam(required = false) BigDecimal orderAmount
    ) {
        VoucherValidationResponse result = voucherService.validateVoucher(code, orderAmount);
        return ResponseEntity.ok(ApiResponse.success(result, "Kiểm tra voucher thành công"));
    }

    @PostMapping("/admin/vouchers")
    @Operation(
            summary = "ADMIN - Tạo voucher mới",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    public ResponseEntity<ApiResponse<VoucherResponse>> create(@Valid @RequestBody CreateVoucherRequest request) {
        VoucherResponse voucher = voucherService.createVoucher(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(voucher, "Tạo voucher thành công"));
    }

    @GetMapping("/admin/vouchers")
    @Operation(
            summary = "ADMIN - Danh sách voucher",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    public ResponseEntity<ApiResponse<java.util.List<VoucherResponse>>> list(
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable
    ) {
        Page<VoucherResponse> page = voucherService.listVouchers(pageable);
        return ResponseEntity.ok(ApiResponse.paged(page.getContent(), "Lấy danh sách voucher thành công", page));
    }

    @GetMapping("/admin/vouchers/{id}")
    @Operation(
            summary = "ADMIN - Chi tiết voucher",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    public ResponseEntity<ApiResponse<VoucherResponse>> getById(@PathVariable UUID id) {
        VoucherResponse voucher = voucherService.getVoucher(id);
        return ResponseEntity.ok(ApiResponse.success(voucher, "Lấy chi tiết voucher thành công"));
    }

    @PutMapping("/admin/vouchers/{id}")
    @Operation(
            summary = "ADMIN - Cập nhật voucher",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    public ResponseEntity<ApiResponse<VoucherResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateVoucherRequest request
    ) {
        VoucherResponse voucher = voucherService.updateVoucher(id, request);
        return ResponseEntity.ok(ApiResponse.success(voucher, "Cập nhật voucher thành công"));
    }
}
