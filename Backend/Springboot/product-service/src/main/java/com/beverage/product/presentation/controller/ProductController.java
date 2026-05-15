package com.beverage.product.presentation.controller;

import com.beverage.product.application.dto.request.CreateProductRequest;
import com.beverage.product.application.dto.request.ReorderItemRequest;
import com.beverage.product.application.dto.request.UpdateProductRequest;
import com.beverage.product.application.dto.response.ProductResponse;
import com.beverage.product.application.dto.response.ProductSuggestResponse;
import com.beverage.product.application.usecase.ProductUseCase;
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
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
@Tag(name = "Products", description = "Danh sách & chi tiết đồ uống")
public class ProductController {

    private static final String S3_FOLDER = "products";

    /** Chỉ cho phép sort theo các trường này để tránh expose field nội bộ. */
    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("displayOrder", "name", "createdAt");

    private final ProductUseCase productUseCase;
    private final CatalogImageStorageService catalogImageStorageService;
    private final CatalogAdminApiSupport catalogAdminApiSupport;

    @GetMapping
    @Operation(summary = "Public - Danh sách sản phẩm có phân trang + filter; ADMIN: ?includeDeleted=true",
               description = "sort hợp lệ: displayOrder | name | createdAt. Mặc định: displayOrder,asc.")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> list(
            @Parameter(description = "Lọc theo danh mục") @RequestParam(required = false) UUID categoryId,
            @Parameter(description = "Lọc isAvailable") @RequestParam(required = false) Boolean isAvailable,
            @Parameter(description = "Lọc isFeatured") @RequestParam(required = false) Boolean isFeatured,
            @Parameter(description = "Tìm kiếm theo tên / mô tả") @RequestParam(required = false) String keyword,
            @Parameter(description = "ADMIN: bao gồm bản ghi đã xóa mềm") @RequestParam(required = false, defaultValue = "false") boolean includeDeleted,
            @PageableDefault(size = 20, sort = "displayOrder") Pageable pageable,
            Authentication authentication) {

        catalogAdminApiSupport.assertAdminWhenIncludingDeleted(includeDeleted, authentication);
        validateSortFields(pageable, ALLOWED_SORT_FIELDS);

        Page<ProductResponse> page = productUseCase.pageProducts(
                categoryId, isAvailable, isFeatured, keyword, includeDeleted, pageable);

        return ResponseEntity.ok(ApiResponse.paged(page.getContent(), "Lấy danh sách sản phẩm thành công", page));
    }

    @GetMapping("/suggest")
    @Operation(
        summary = "Public - Autocomplete / suggest sản phẩm theo keyword",
        description = "Trả về danh sách gọn (id, name, slug, imageUrl, categoryId) — dùng cho thanh tìm kiếm. " +
                      "Kết hợp debounce 300ms ở FE. size tối đa 20, mặc định 8.")
    public ResponseEntity<ApiResponse<List<ProductSuggestResponse>>> suggest(
            @Parameter(description = "Từ khóa tìm kiếm") @RequestParam(required = false, defaultValue = "") String keyword,
            @Parameter(description = "Số gợi ý tối đa (1-20)") @RequestParam(required = false, defaultValue = "8") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                productUseCase.suggestProducts(keyword, size),
                "Gợi ý sản phẩm thành công"));
    }

    @PatchMapping("/reorder")
    @Operation(summary = "ADMIN - Sắp xếp lại displayOrder cho nhiều sản phẩm cùng lúc (batch)")
    public ResponseEntity<ApiResponse<Void>> reorder(
            @Valid @RequestBody List<@Valid ReorderItemRequest> items) {
        productUseCase.reorderProducts(items);
        return ResponseEntity.ok(ApiResponse.success(null, "Sắp xếp thứ tự sản phẩm thành công"));
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
