package com.beverage.storage.api;

/**
 * API lưu trữ object dùng chung. Mỗi Spring service thêm dependency {@code shared-storage},
 * bật {@code beverage.storage.s3.enabled=true} và inject bean này.
 */
public interface ObjectStorageService {

    /**
     * Upload ảnh (bytes đã đọc từ multipart hoặc từ luồng khác).
     *
     * @param folder      ví dụ {@code products}, {@code categories}, {@code avatars} — nằm dưới {@code key-prefix}
     * @param contentType MIME, phải thuộc danh sách image/* được phép
     * @param bytes       nội dung file
     * @return key + URL công khai (hoặc base CDN nếu cấu hình override)
     */
    UploadedObject putImage(String folder, String contentType, byte[] bytes);

    /**
     * Xóa object theo key hoặc public URL đã trả về trước đó.
     * Nếu object không tồn tại thì bỏ qua (idempotent).
     */
    void deleteByKeyOrUrl(String keyOrUrl);

    /**
     * Kiểm tra object có tồn tại theo key hoặc public URL.
     */
    boolean existsByKeyOrUrl(String keyOrUrl);
}
