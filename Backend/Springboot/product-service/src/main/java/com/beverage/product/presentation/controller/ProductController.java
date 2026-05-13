package com.beverage.product.presentation.controller;

import com.beverage.product.application.dto.request.CreateProductRequest;
import com.beverage.product.application.dto.request.UpdateProductRequest;
import com.beverage.product.application.dto.response.ProductResponse;
import com.beverage.product.application.usecase.ProductUseCase;
import com.beverage.product.common.ApiResponse;
import com.beverage.product.infrastructure.storage.CatalogImageStorageService;
import com.beverage.product.presentation.support.CatalogAdminApiSupport;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
@Tag(name = "Products", description = "Danh sách & chi tiết đồ uống")
public class ProductController {

    private static final String S3_FOLDER = "products";

    private final ProductUseCase productUseCase;
    private final CatalogImageStorageService catalogImageStorageService;
    private final CatalogAdminApiSupport catalogAdminApiSupport;

    @GetMapping
    @Operation(summary = "Public - List products (optional filters; ADMIN: ?includeDeleted=true)")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> list(
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) Boolean isAvailable,
            @RequestParam(required = false) Boolean isFeatured,
            @RequestParam(required = false, defaultValue = "false") boolean includeDeleted,
            Authentication authentication) {
        catalogAdminApiSupport.assertAdminWhenIncludingDeleted(includeDeleted, authentication);
        List<ProductResponse> response = productUseCase.listProducts(categoryId, isAvailable, isFeatured, includeDeleted);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách sản phẩm thành công"));
    }

    @GetMapping("/by-slug/{slug}")
    @Operation(summary = "Public - Lấy chi tiết sản phẩm theo slug (cùng payload với GET theo id: variants, toppings)")
    public ResponseEntity<ApiResponse<ProductResponse>> getDetailBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(ApiResponse.success(productUseCase.getProductDetailBySlug(slug),
                "Lấy chi tiết sản phẩm thành công"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Public - Get product detail by id")
    public ResponseEntity<ApiResponse<ProductResponse>> getDetail(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(productUseCase.getProductDetail(id),
                "Lấy chi tiết sản phẩm thành công"));
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "ADMIN - Create product (JSON)")
    public ResponseEntity<ApiResponse<ProductResponse>> createJson(@Valid @RequestBody CreateProductRequest request) {
        ProductResponse response = productUseCase.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Tạo sản phẩm thành công"));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "ADMIN - Create product (multipart: part \"data\" = JSON, optional part \"image\" = file → S3)")
    public ResponseEntity<ApiResponse<ProductResponse>> createMultipart(
            @Valid @RequestPart("data") CreateProductRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        var resolved = catalogImageStorageService.resolveImage(request.getImageUrl(), image, S3_FOLDER);
        request.setImageUrl(resolved.imageUrl());
        try {
            ProductResponse response = productUseCase.createProduct(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(response, "Tạo sản phẩm thành công"));
        } catch (RuntimeException ex) {
            catalogImageStorageService.rollbackUploadedQuietly(resolved.uploadedKey());
            throw ex;
        }
    }

    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "ADMIN - Update product (JSON)")
    public ResponseEntity<ApiResponse<ProductResponse>> updateJson(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateProductRequest request) {
        return ResponseEntity.ok(ApiResponse.success(productUseCase.updateProduct(id, request),
                "Cập nhật sản phẩm thành công"));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "ADMIN - Update product (multipart: data JSON + optional image → S3)")
    public ResponseEntity<ApiResponse<ProductResponse>> updateMultipart(
            @PathVariable UUID id,
            @Valid @RequestPart("data") UpdateProductRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        var resolved = catalogImageStorageService.resolveImage(request.getImageUrl(), image, S3_FOLDER);
        request.setImageUrl(resolved.imageUrl());
        try {
            return ResponseEntity.ok(ApiResponse.success(productUseCase.updateProduct(id, request),
                    "Cập nhật sản phẩm thành công"));
        } catch (RuntimeException ex) {
            catalogImageStorageService.rollbackUploadedQuietly(resolved.uploadedKey());
            throw ex;
        }
    }

    @PatchMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "ADMIN - Patch product (JSON, same as PUT for MVP)")
    public ResponseEntity<ApiResponse<ProductResponse>> patchJson(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateProductRequest request) {
        return updateJson(id, request);
    }

    @PatchMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "ADMIN - Patch product (multipart, same as PUT multipart)")
    public ResponseEntity<ApiResponse<ProductResponse>> patchMultipart(
            @PathVariable UUID id,
            @Valid @RequestPart("data") UpdateProductRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        return updateMultipart(id, request, image);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "ADMIN - Soft delete product")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        productUseCase.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa sản phẩm thành công"));
    }

    @PostMapping("/{id}/restore")
    @Operation(summary = "ADMIN - Khôi phục sản phẩm đã xóa mềm")
    public ResponseEntity<ApiResponse<Void>> restore(@PathVariable UUID id) {
        productUseCase.restoreProduct(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Khôi phục sản phẩm thành công"));
    }
}
