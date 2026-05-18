package com.beverage.storage.api;

/**
 * Kết quả sau khi đẩy object lên S3 — service gọi lưu {@link #key()} hoặc {@link #publicUrl()} vào DB.
 */
public record UploadedObject(
        String key,
        String publicUrl,
        String contentType,
        long sizeBytes
) {
}
