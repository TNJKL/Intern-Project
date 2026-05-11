package com.beverage.product.presentation.controller;

import com.beverage.product.application.dto.request.CreateCategoryRequest;
import com.beverage.product.application.dto.request.UpdateCategoryRequest;
import com.beverage.product.application.dto.response.CategoryResponse;
import com.beverage.product.application.usecase.CategoryUseCase;
import com.beverage.product.common.ApiResponse;
import com.beverage.product.infrastructure.storage.CatalogImageStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
@Tag(name = "Categories", description = "Danh mục sản phẩm")
public class CategoryController {

    private static final String S3_FOLDER = "categories";

    private final CategoryUseCase categoryUseCase;
    private final CatalogImageStorageService catalogImageStorageService;

    @GetMapping
    @Operation(summary = "Public - List active categories")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> listActive() {
        return ResponseEntity.ok(ApiResponse.success(categoryUseCase.listCategoriesActive(),
                "Lấy danh sách danh mục thành công"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Public - Get category by id")
    public ResponseEntity<ApiResponse<CategoryResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(categoryUseCase.getCategoryById(id),
                "Lấy danh mục thành công"));
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "ADMIN - Create category (JSON)")
    public ResponseEntity<ApiResponse<CategoryResponse>> createJson(@Valid @RequestBody CreateCategoryRequest request) {
        CategoryResponse response = categoryUseCase.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Tạo danh mục thành công"));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "ADMIN - Create category (multipart: part \"data\" = JSON, optional \"image\" → S3)")
    public ResponseEntity<ApiResponse<CategoryResponse>> createMultipart(
            @Valid @RequestPart("data") CreateCategoryRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        var resolved = catalogImageStorageService.resolveImage(request.getImageUrl(), image, S3_FOLDER);
        request.setImageUrl(resolved.imageUrl());
        try {
            CategoryResponse response = categoryUseCase.createCategory(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(response, "Tạo danh mục thành công"));
        } catch (RuntimeException ex) {
            catalogImageStorageService.rollbackUploadedQuietly(resolved.uploadedKey());
            throw ex;
        }
    }

    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "ADMIN - Update category (JSON)")
    public ResponseEntity<ApiResponse<CategoryResponse>> updateJson(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCategoryRequest request) {
        return ResponseEntity.ok(ApiResponse.success(categoryUseCase.updateCategory(id, request),
                "Cập nhật danh mục thành công"));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "ADMIN - Update category (multipart)")
    public ResponseEntity<ApiResponse<CategoryResponse>> updateMultipart(
            @PathVariable UUID id,
            @Valid @RequestPart("data") UpdateCategoryRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        var resolved = catalogImageStorageService.resolveImage(request.getImageUrl(), image, S3_FOLDER);
        request.setImageUrl(resolved.imageUrl());
        try {
            return ResponseEntity.ok(ApiResponse.success(categoryUseCase.updateCategory(id, request),
                    "Cập nhật danh mục thành công"));
        } catch (RuntimeException ex) {
            catalogImageStorageService.rollbackUploadedQuietly(resolved.uploadedKey());
            throw ex;
        }
    }

    @PatchMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "ADMIN - Patch category (JSON)")
    public ResponseEntity<ApiResponse<CategoryResponse>> patchJson(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCategoryRequest request) {
        return updateJson(id, request);
    }

    @PatchMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "ADMIN - Patch category (multipart)")
    public ResponseEntity<ApiResponse<CategoryResponse>> patchMultipart(
            @PathVariable UUID id,
            @Valid @RequestPart("data") UpdateCategoryRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        return updateMultipart(id, request, image);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "ADMIN - Delete category")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        categoryUseCase.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa danh mục thành công"));
    }
}
