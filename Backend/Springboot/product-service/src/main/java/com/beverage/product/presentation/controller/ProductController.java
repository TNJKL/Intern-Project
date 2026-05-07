package com.beverage.product.presentation.controller;

import com.beverage.product.application.dto.request.CreateProductRequest;
import com.beverage.product.application.dto.request.UpdateProductRequest;
import com.beverage.product.application.dto.response.ProductResponse;
import com.beverage.product.application.usecase.ProductUseCase;
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
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
@Tag(name = "Products", description = "Danh sách & chi tiết đồ uống")
public class ProductController {

    private final ProductUseCase productUseCase;

    @GetMapping
    @Operation(summary = "Public - List products (optional filters)")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> list(
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) Boolean isAvailable,
            @RequestParam(required = false) Boolean isFeatured) {
        List<ProductResponse> response = productUseCase.listProducts(categoryId, isAvailable, isFeatured);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách sản phẩm thành công"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Public - Get product detail by id")
    public ResponseEntity<ApiResponse<ProductResponse>> getDetail(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(productUseCase.getProductDetail(id),
                "Lấy chi tiết sản phẩm thành công"));
    }

    @PostMapping
    @Operation(summary = "ADMIN - Create product")
    public ResponseEntity<ApiResponse<ProductResponse>> create(
            @Valid @RequestBody CreateProductRequest request) {
        ProductResponse response = productUseCase.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Tạo sản phẩm thành công"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "ADMIN - Update product")
    public ResponseEntity<ApiResponse<ProductResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateProductRequest request) {
        return ResponseEntity.ok(ApiResponse.success(productUseCase.updateProduct(id, request),
                "Cập nhật sản phẩm thành công"));
    }

    @PatchMapping("/{id}")
    @Operation(summary = "ADMIN - Patch product (same as PUT for MVP)")
    public ResponseEntity<ApiResponse<ProductResponse>> patch(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateProductRequest request) {
        return update(id, request);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "ADMIN - Delete product")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        productUseCase.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa sản phẩm thành công"));
    }
}

