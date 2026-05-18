package com.beverage.product.presentation.controller;

import com.beverage.product.application.dto.request.CreateCategoryRequest;
import com.beverage.product.application.dto.request.ReorderItemRequest;
import com.beverage.product.application.dto.request.UpdateCategoryRequest;
import com.beverage.product.application.dto.response.CategoryResponse;
import com.beverage.product.application.usecase.CategoryUseCase;
import com.beverage.product.common.ApiResponse;
import com.beverage.product.infrastructure.storage.CatalogImageStorageService;
import com.beverage.product.presentation.support.CatalogAdminApiSupport;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
@Tag(name = "Categories", description = "Danh mục sản phẩm")
public class CategoryController {

    private static final String S3_FOLDER = "categories";

    /** Chỉ cho phép sort theo các trường này để tránh expose field nội bộ. */
    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("displayOrder", "name", "createdAt");

    private final CategoryUseCase categoryUseCase;
    private final CatalogImageStorageService catalogImageStorageService;
    private final CatalogAdminApiSupport catalogAdminApiSupport;

    @GetMapping
    @Operation(summary = "Danh sách danh mục có phân trang + keyword; ADMIN: ?includeDeleted=true",
               description = "sort hợp lệ: displayOrder | name | createdAt. Mặc định: displayOrder,asc.")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> list(
            @Parameter(description = "Tìm kiếm theo tên danh mục") @RequestParam(required = false) String keyword,
            @Parameter(description = "ADMIN: bao gồm bản ghi đã xóa mềm") @RequestParam(required = false, defaultValue = "false") boolean includeDeleted,
            @PageableDefault(size = 20, sort = "displayOrder") Pageable pageable,
            Authentication authentication) {

        catalogAdminApiSupport.assertAdminWhenIncludingDeleted(includeDeleted, authentication);
        validateSortFields(pageable, ALLOWED_SORT_FIELDS);

        Page<CategoryResponse> page = categoryUseCase.pageCategories(keyword, includeDeleted, pageable);

        return ResponseEntity.ok(ApiResponse.paged(page.getContent(), "Lấy danh sách danh mục thành công", page));
    }

    @PatchMapping("/reorder")
    @Operation(summary = "ADMIN - Sắp xếp lại displayOrder cho nhiều danh mục cùng lúc (batch)")
    public ResponseEntity<ApiResponse<Void>> reorder(
            @Valid @RequestBody List<@Valid ReorderItemRequest> items) {
        categoryUseCase.reorderCategories(items);
        return ResponseEntity.ok(ApiResponse.success(null, "Sắp xếp thứ tự danh mục thành công"));
    }

    @GetMapping("/by-slug/{slug}")
    @Operation(summary = "Public - Lấy danh mục theo slug (URL thân thiện; cùng payload với GET theo id)")
    public ResponseEntity<ApiResponse<CategoryResponse>> getBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(ApiResponse.success(categoryUseCase.getCategoryBySlug(slug),
                "Lấy danh mục thành công"));
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
    @Operation(summary = "ADMIN - Soft delete category")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        categoryUseCase.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa danh mục thành công"));
    }

    @PostMapping("/{id}/restore")
    @Operation(summary = "ADMIN - Khôi phục danh mục đã xóa mềm")
    public ResponseEntity<ApiResponse<Void>> restore(@PathVariable UUID id) {
        categoryUseCase.restoreCategory(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Khôi phục danh mục thành công"));
    }

    private static void validateSortFields(Pageable pageable, Set<String> allowed) {
        pageable.getSort().forEach(order -> {
            if (!allowed.contains(order.getProperty())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Trường sắp xếp không hợp lệ: '" + order.getProperty()
                                + "'. Cho phép: " + allowed);
            }
        });
    }
}
