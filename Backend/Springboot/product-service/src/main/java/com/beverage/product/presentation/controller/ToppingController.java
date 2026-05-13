package com.beverage.product.presentation.controller;

import com.beverage.product.application.dto.request.CreateToppingRequest;
import com.beverage.product.application.dto.request.UpdateToppingRequest;
import com.beverage.product.application.dto.response.ToppingResponse;
import com.beverage.product.application.usecase.ToppingUseCase;
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
@RequestMapping("/api/v1/toppings")
@RequiredArgsConstructor
@Tag(name = "Toppings", description = "Toppings (add-ons) cho đồ uống")
public class ToppingController {

    private static final String S3_FOLDER = "toppings";

    private final ToppingUseCase toppingUseCase;
    private final CatalogImageStorageService catalogImageStorageService;
    private final CatalogAdminApiSupport catalogAdminApiSupport;

    @GetMapping
    @Operation(summary = "List toppings (mặc định đang bán; ADMIN có thể ?includeDeleted=true)")
    public ResponseEntity<ApiResponse<List<ToppingResponse>>> list(
            @RequestParam(required = false, defaultValue = "false") boolean includeDeleted,
            Authentication authentication) {
        catalogAdminApiSupport.assertAdminWhenIncludingDeleted(includeDeleted, authentication);
        return ResponseEntity.ok(ApiResponse.success(toppingUseCase.listToppings(includeDeleted),
                "Lấy danh sách toppings thành công"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Public - Get topping by id")
    public ResponseEntity<ApiResponse<ToppingResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(toppingUseCase.getToppingById(id),
                "Lấy topping thành công"));
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "ADMIN - Create topping (JSON)")
    public ResponseEntity<ApiResponse<ToppingResponse>> createJson(@Valid @RequestBody CreateToppingRequest request) {
        ToppingResponse response = toppingUseCase.createTopping(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Tạo topping thành công"));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "ADMIN - Create topping (multipart: part \"data\" = JSON, optional \"image\" → S3)")
    public ResponseEntity<ApiResponse<ToppingResponse>> createMultipart(
            @Valid @RequestPart("data") CreateToppingRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        var resolved = catalogImageStorageService.resolveImage(request.getImageUrl(), image, S3_FOLDER);
        request.setImageUrl(resolved.imageUrl());
        try {
            ToppingResponse response = toppingUseCase.createTopping(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(response, "Tạo topping thành công"));
        } catch (RuntimeException ex) {
            catalogImageStorageService.rollbackUploadedQuietly(resolved.uploadedKey());
            throw ex;
        }
    }

    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "ADMIN - Update topping (JSON)")
    public ResponseEntity<ApiResponse<ToppingResponse>> updateJson(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateToppingRequest request) {
        return ResponseEntity.ok(ApiResponse.success(toppingUseCase.updateTopping(id, request),
                "Cập nhật topping thành công"));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "ADMIN - Update topping (multipart)")
    public ResponseEntity<ApiResponse<ToppingResponse>> updateMultipart(
            @PathVariable UUID id,
            @Valid @RequestPart("data") UpdateToppingRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        var resolved = catalogImageStorageService.resolveImage(request.getImageUrl(), image, S3_FOLDER);
        request.setImageUrl(resolved.imageUrl());
        try {
            return ResponseEntity.ok(ApiResponse.success(toppingUseCase.updateTopping(id, request),
                    "Cập nhật topping thành công"));
        } catch (RuntimeException ex) {
            catalogImageStorageService.rollbackUploadedQuietly(resolved.uploadedKey());
            throw ex;
        }
    }

    @PatchMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "ADMIN - Patch topping (JSON)")
    public ResponseEntity<ApiResponse<ToppingResponse>> patchJson(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateToppingRequest request) {
        return updateJson(id, request);
    }

    @PatchMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "ADMIN - Patch topping (multipart)")
    public ResponseEntity<ApiResponse<ToppingResponse>> patchMultipart(
            @PathVariable UUID id,
            @Valid @RequestPart("data") UpdateToppingRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        return updateMultipart(id, request, image);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "ADMIN - Soft delete topping")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        toppingUseCase.deleteTopping(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa topping thành công"));
    }

    @PostMapping("/{id}/restore")
    @Operation(summary = "ADMIN - Khôi phục topping đã xóa mềm")
    public ResponseEntity<ApiResponse<Void>> restore(@PathVariable UUID id) {
        toppingUseCase.restoreTopping(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Khôi phục topping thành công"));
    }
}
