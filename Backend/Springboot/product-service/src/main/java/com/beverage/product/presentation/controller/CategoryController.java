package com.beverage.product.presentation.controller;

import com.beverage.product.application.dto.request.CreateCategoryRequest;
import com.beverage.product.application.dto.request.UpdateCategoryRequest;
import com.beverage.product.application.dto.response.CategoryResponse;
import com.beverage.product.application.usecase.CategoryUseCase;
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
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
@Tag(name = "Categories", description = "Danh mục sản phẩm")
public class CategoryController {

    private final CategoryUseCase categoryUseCase;

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

    @PostMapping
    @Operation(summary = "ADMIN - Create category")
    public ResponseEntity<ApiResponse<CategoryResponse>> create(
            @Valid @RequestBody CreateCategoryRequest request) {
        CategoryResponse response = categoryUseCase.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Tạo danh mục thành công"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "ADMIN - Update category")
    public ResponseEntity<ApiResponse<CategoryResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCategoryRequest request) {
        return ResponseEntity.ok(ApiResponse.success(categoryUseCase.updateCategory(id, request),
                "Cập nhật danh mục thành công"));
    }

    @PatchMapping("/{id}")
    @Operation(summary = "ADMIN - Patch category (same as PUT for MVP)")
    public ResponseEntity<ApiResponse<CategoryResponse>> patch(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCategoryRequest request) {
        return update(id, request);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "ADMIN - Delete category")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        categoryUseCase.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa danh mục thành công"));
    }
}

