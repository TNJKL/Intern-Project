package com.beverage.product.infrastructure.storage;

import com.beverage.product.domain.exception.BusinessException;
import com.beverage.storage.api.ObjectStorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * Khi tạo/cập nhật catalog kèm multipart ảnh: upload lên S3 qua {@link ObjectStorageService}
 * (cùng logic với {@code POST /api/v1/storage/images}, không gọi HTTP nội bộ).
 */
@Service
@Slf4j
public class CatalogImageStorageService {

    private final ObjectProvider<ObjectStorageService> objectStorageProvider;

    public CatalogImageStorageService(ObjectProvider<ObjectStorageService> objectStorageProvider) {
        this.objectStorageProvider = objectStorageProvider;
    }

    /**
     * @param jsonImageUrl URL từ JSON (có thể null) — dùng khi không gửi file
     * @param image        part ảnh (optional); nếu có nội dung thì upload S3 và trả public URL (ghi đè jsonImageUrl)
     * @param s3Folder     tiền tố folder trên S3: products | categories | toppings
     */
    public ImageResolution resolveImage(String jsonImageUrl, MultipartFile image, String s3Folder) {
        if (image == null || image.isEmpty()) {
            return new ImageResolution(jsonImageUrl, null);
        }
        ObjectStorageService storage = objectStorageProvider.getIfAvailable();
        if (storage == null) {
            throw new BusinessException(
                    "Gửi kèm file ảnh cần bật S3: beverage.storage.s3.enabled=true và cấu hình bucket/credential.");
        }
        String contentType = image.getContentType();
        if (contentType == null || contentType.isBlank()) {
            throw new BusinessException("Không xác định được Content-Type của file ảnh.");
        }
        try {
            var uploaded = storage.putImage(s3Folder, contentType, image.getBytes());
            return new ImageResolution(uploaded.publicUrl(), uploaded.key());
        } catch (IOException e) {
            throw new BusinessException("Không đọc được nội dung file ảnh: " + e.getMessage());
        }
    }

    public void rollbackUploadedQuietly(String uploadedKey) {
        if (uploadedKey == null || uploadedKey.isBlank()) {
            return;
        }
        ObjectStorageService storage = objectStorageProvider.getIfAvailable();
        if (storage == null) {
            return;
        }
        try {
            storage.deleteByKeyOrUrl(uploadedKey);
        } catch (Exception ignored) {
            // rollback best-effort, không che lỗi nghiệp vụ gốc
        }
    }

    public void deleteIfChangedQuietly(String oldImageUrl, String newImageUrl) {
        if (oldImageUrl == null || oldImageUrl.isBlank()) {
            return;
        }
        if (newImageUrl != null && oldImageUrl.equals(newImageUrl)) {
            return;
        }
        ObjectStorageService storage = objectStorageProvider.getIfAvailable();
        if (storage == null) {
            return;
        }
        try {
            storage.deleteByKeyOrUrl(oldImageUrl);
        } catch (Exception e) {
            log.warn("Xóa ảnh cũ trên S3 thất bại (best-effort), có thể còn object orphan: {} — {}",
                    oldImageUrl, e.getMessage());
        }
    }

    public boolean existsOnStorage(String imageUrlOrKey) {
        ObjectStorageService storage = objectStorageProvider.getIfAvailable();
        if (storage == null) {
            return false;
        }
        return storage.existsByKeyOrUrl(imageUrlOrKey);
    }

    public record ImageResolution(String imageUrl, String uploadedKey) {
    }
}
