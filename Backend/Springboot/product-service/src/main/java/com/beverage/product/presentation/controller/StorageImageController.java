package com.beverage.product.presentation.controller;

import com.beverage.product.application.dto.response.ImageUploadResponse;
import com.beverage.product.common.ApiResponse;
import com.beverage.product.infrastructure.storage.StorageConsistencyService;
import com.beverage.storage.api.ObjectStorageService;
import com.beverage.storage.api.UploadedObject;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/storage")
@RequiredArgsConstructor
@Tag(name = "Storage", description = "Upload ảnh qua shared-storage (S3)")
public class StorageImageController {

    private final ObjectProvider<ObjectStorageService> objectStorageProvider;
    private final StorageConsistencyService storageConsistencyService;

    @PostMapping(value = "/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload ảnh (ADMIN) — dùng shared-storage S3")
    public ResponseEntity<ApiResponse<ImageUploadResponse>> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", defaultValue = "misc") String folder) throws IOException {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Thiếu file"));
        }
        String contentType = file.getContentType();
        if (contentType == null) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Không xác định được content-type"));
        }
        ObjectStorageService objectStorageService = objectStorageProvider.getIfAvailable();
        if (objectStorageService == null) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(ApiResponse.error(
                            "Storage chưa sẵn sàng. Hãy bật beverage.storage.s3.enabled=true và cấu hình AWS bucket/credential."));
        }
        byte[] bytes = file.getBytes();
        UploadedObject uploaded = objectStorageService.putImage(folder, contentType, bytes);
        ImageUploadResponse body = ImageUploadResponse.builder()
                .key(uploaded.key())
                .publicUrl(uploaded.publicUrl())
                .contentType(uploaded.contentType())
                .sizeBytes(uploaded.sizeBytes())
                .build();
        return ResponseEntity.ok(ApiResponse.success(body, "Upload thành công"));
    }

    @GetMapping("/consistency/catalog")
    @Operation(summary = "ADMIN - Kiểm tra consistency imageUrl trong DB với object thật trên S3")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkCatalogConsistency() {
        Map<String, Object> report = storageConsistencyService.checkCatalogImageConsistency();
        return ResponseEntity.ok(ApiResponse.success(report, "Kiểm tra consistency thành công"));
    }
}
