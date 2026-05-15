package com.beverage.product.presentation.controller;

import com.beverage.product.application.dto.request.CreateProductVariantRequest;
import com.beverage.product.application.dto.request.UpdateProductVariantRequest;
import com.beverage.product.application.dto.response.ProductVariantResponse;
import com.beverage.product.application.usecase.ProductVariantUseCase;
import com.beverage.product.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/products/{productId}/variants")
@RequiredArgsConstructor
@Tag(name = "Product variants", description = "Size / giá theo sản phẩm")
public class ProductVariantController {

    private final ProductVariantUseCase productVariantUseCase;

    @GetMapping
    @Operation(summary = "Public - Danh sách variant của sản phẩm")
    public ResponseEntity<ApiResponse<List<ProductVariantResponse>>> list(@PathVariable UUID productId) {
        return ResponseEntity.ok(ApiResponse.success(
                productVariantUseCase.listVariants(productId),
                "Lấy danh sách variant thành công"));
    }

    @PostMapping
    @Operation(summary = "ADMIN - Thêm variant")
    public ResponseEntity<ApiResponse<ProductVariantResponse>> create(
            @PathVariable UUID productId,
            @Valid @RequestBody CreateProductVariantRequest request) {
        ProductVariantResponse body = productVariantUseCase.createVariant(productId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(body, "Tạo variant thành công"));
    }

    @PutMapping("/{variantId}")
    @Operation(summary = "ADMIN - Cập nhật variant")
    public ResponseEntity<ApiResponse<ProductVariantResponse>> update(
            @PathVariable UUID productId,
            @PathVariable UUID variantId,
            @Valid @RequestBody UpdateProductVariantRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                productVariantUseCase.updateVariant(productId, variantId, request),
                "Cập nhật variant thành công"));
    }

    @DeleteMapping("/{variantId}")
    @Operation(summary = "ADMIN - Xóa mềm variant")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID productId,
            @PathVariable UUID variantId) {
        productVariantUseCase.deleteVariant(productId, variantId);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa variant thành công"));
    }
}
