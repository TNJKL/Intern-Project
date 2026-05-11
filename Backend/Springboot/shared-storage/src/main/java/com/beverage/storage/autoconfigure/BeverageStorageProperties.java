package com.beverage.storage.autoconfigure;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Prefix: {@code beverage.storage.s3.*}
 */
@ConfigurationProperties(prefix = "beverage.storage.s3")
public class BeverageStorageProperties {

    /**
     * Tắt mặc định — service không cấu hình bucket vẫn khởi động được.
     */
    private boolean enabled = false;

    private String bucket;
    private String region = "ap-southeast-1";

    /**
     * Tiền tố key trên bucket, ví dụ {@code beverage/dev} — không có slash đầu/cuối thừa.
     */
    private String keyPrefix = "beverage/dev";

    private long maxBytes = 5 * 1024 * 1024;

    /**
     * Nếu set (vd. CloudFront), {@link UploadedObject#publicUrl()} = base + "/" + key.
     * Để trống thì dùng URL virtual-hosted S3 chuẩn.
     */
    private String publicBaseUrl = "";

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getBucket() {
        return bucket;
    }

    public void setBucket(String bucket) {
        this.bucket = bucket;
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public String getKeyPrefix() {
        return keyPrefix;
    }

    public void setKeyPrefix(String keyPrefix) {
        this.keyPrefix = keyPrefix;
    }

    public long getMaxBytes() {
        return maxBytes;
    }

    public void setMaxBytes(long maxBytes) {
        this.maxBytes = maxBytes;
    }

    public String getPublicBaseUrl() {
        return publicBaseUrl;
    }

    public void setPublicBaseUrl(String publicBaseUrl) {
        this.publicBaseUrl = publicBaseUrl;
    }
}
