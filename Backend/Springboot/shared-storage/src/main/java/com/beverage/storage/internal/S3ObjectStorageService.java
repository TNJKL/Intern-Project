package com.beverage.storage.internal;

import com.beverage.storage.StorageException;
import com.beverage.storage.api.ObjectStorageService;
import com.beverage.storage.api.UploadedObject;
import com.beverage.storage.autoconfigure.BeverageStorageProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

import java.net.URI;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Map;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

public class S3ObjectStorageService implements ObjectStorageService {

    private static final Logger log = LoggerFactory.getLogger(S3ObjectStorageService.class);

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
    );

    private static final Map<String, String> EXTENSION_BY_CONTENT_TYPE = Map.of(
            "image/jpeg", "jpg",
            "image/png", "png",
            "image/webp", "webp",
            "image/gif", "gif"
    );

    private final S3Client s3Client;
    private final BeverageStorageProperties properties;

    public S3ObjectStorageService(S3Client s3Client, BeverageStorageProperties properties) {
        this.s3Client = s3Client;
        this.properties = properties;
    }

    @Override
    public UploadedObject putImage(String folder, String contentType, byte[] bytes) {
        if (folder == null || folder.isBlank()) {
            throw new StorageException("folder không được để trống");
        }
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new StorageException("content-type không được phép: " + contentType);
        }
        if (bytes == null || bytes.length == 0) {
            throw new StorageException("file rỗng");
        }
        if (bytes.length > properties.getMaxBytes()) {
            throw new StorageException("file vượt quá giới hạn " + properties.getMaxBytes() + " bytes");
        }

        String safeFolder = sanitizeFolder(folder);
        String ext = EXTENSION_BY_CONTENT_TYPE.get(contentType.toLowerCase());
        String key = buildObjectKey(safeFolder, ext);

        try {
            PutObjectRequest put = PutObjectRequest.builder()
                    .bucket(properties.getBucket())
                    .key(key)
                    .contentType(contentType)
                    .contentLength((long) bytes.length)
                    .build();
            s3Client.putObject(put, RequestBody.fromBytes(bytes));
            String url = buildPublicUrl(key);
            log.debug("Uploaded s3://{}/{} -> {}", properties.getBucket(), key, url);
            return new UploadedObject(key, url, contentType, bytes.length);
        } catch (StorageException e) {
            throw e;
        } catch (Exception e) {
            throw new StorageException(
                    "Lỗi khi upload lên S3 (bucket=" + properties.getBucket() + ", region=" + properties.getRegion()
                            + "): " + e.getMessage(),
                    e);
        }
    }

    @Override
    public void deleteByKeyOrUrl(String keyOrUrl) {
        String key = toObjectKeyOrNull(keyOrUrl);
        if (key == null) {
            if (keyOrUrl != null && !keyOrUrl.isBlank()) {
                log.info("Bỏ qua xóa S3: URL/key không thuộc bucket/key-prefix đang cấu hình (an toàn): {}",
                        keyOrUrl.length() > 200 ? keyOrUrl.substring(0, 200) + "…" : keyOrUrl);
            }
            return;
        }
        try {
            DeleteObjectRequest req = DeleteObjectRequest.builder()
                    .bucket(properties.getBucket())
                    .key(key)
                    .build();
            s3Client.deleteObject(req);
            log.debug("Deleted s3://{}/{}", properties.getBucket(), key);
        } catch (S3Exception e) {
            // delete là idempotent: object không còn thì coi như đã xong
            if (e.statusCode() == 404 || "NoSuchKey".equalsIgnoreCase(e.awsErrorDetails() != null
                    ? e.awsErrorDetails().errorCode() : null)) {
                return;
            }
            throw new StorageException("Lỗi khi xóa object trên S3: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new StorageException("Lỗi khi xóa object trên S3: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean existsByKeyOrUrl(String keyOrUrl) {
        String key = toObjectKeyOrNull(keyOrUrl);
        if (key == null) {
            return false;
        }
        try {
            HeadObjectRequest req = HeadObjectRequest.builder()
                    .bucket(properties.getBucket())
                    .key(key)
                    .build();
            s3Client.headObject(req);
            return true;
        } catch (NoSuchKeyException e) {
            return false;
        } catch (S3Exception e) {
            if (e.statusCode() == 404) {
                return false;
            }
            throw new StorageException("Lỗi khi kiểm tra object trên S3: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new StorageException("Lỗi khi kiểm tra object trên S3: " + e.getMessage(), e);
        }
    }

    private String sanitizeFolder(String folder) {
        String f = folder.trim().toLowerCase().replaceAll("[^a-z0-9/_-]", "");
        if (f.isEmpty()) {
            throw new StorageException("folder không hợp lệ");
        }
        if (f.startsWith("/")) {
            f = f.substring(1);
        }
        return f;
    }

    private String buildObjectKey(String folder, String ext) {
        String prefix = properties.getKeyPrefix().replaceAll("^/+|/+$", "");
        String id = UUID.randomUUID().toString();
        return prefix + "/" + folder + "/" + id + "." + ext;
    }

    private String buildPublicUrl(String key) {
        String base = properties.getPublicBaseUrl();
        if (base != null && !base.isBlank()) {
            String b = base.replaceAll("/+$", "");
            return b + "/" + encodeKeyForUrl(key);
        }
        String bucket = properties.getBucket();
        String region = properties.getRegion();
        String host = bucket + ".s3." + region + ".amazonaws.com";
        return "https://" + host + "/" + encodeKeyForUrl(key);
    }

    private static String encodeKeyForUrl(String key) {
        return Arrays.stream(key.split("/", -1))
                .map(s -> URLEncoder.encode(s, StandardCharsets.UTF_8).replace("+", "%20"))
                .collect(Collectors.joining("/"));
    }

    private String toObjectKeyOrNull(String keyOrUrl) {
        if (keyOrUrl == null || keyOrUrl.isBlank()) {
            return null;
        }
        String raw = keyOrUrl.trim();
        String normalizedPrefix = normalizePrefix(properties.getKeyPrefix());
        if (!raw.startsWith("http://") && !raw.startsWith("https://")) {
            return keepManagedKeyOrNull(raw, normalizedPrefix);
        }
        try {
            URI uri = URI.create(raw);
            if (!isManagedPublicUrl(uri)) {
                return null;
            }
            String path = uri.getPath();
            if (path == null || path.isBlank() || "/".equals(path)) {
                return null;
            }
            String key = path.startsWith("/") ? path.substring(1) : path;
            String decoded = URLDecoder.decode(key, StandardCharsets.UTF_8);
            return keepManagedKeyOrNull(decoded, normalizedPrefix);
        } catch (Exception ignored) {
            return null;
        }
    }

    private boolean isManagedPublicUrl(URI uri) {
        String host = uri.getHost();
        if (host == null || host.isBlank()) {
            return false;
        }
        String inputHost = host.toLowerCase(Locale.ROOT);

        String configuredBase = properties.getPublicBaseUrl();
        if (configuredBase != null && !configuredBase.isBlank()) {
            try {
                URI baseUri = URI.create(configuredBase.trim());
                String baseHost = baseUri.getHost();
                return baseHost != null && inputHost.equals(baseHost.toLowerCase(Locale.ROOT));
            } catch (Exception ignored) {
                // fallback xuống host S3 chuẩn nếu public-base-url cấu hình lỗi
            }
        }

        String s3Host = (properties.getBucket() + ".s3." + properties.getRegion() + ".amazonaws.com")
                .toLowerCase(Locale.ROOT);
        return inputHost.equals(s3Host);
    }

    private static String normalizePrefix(String keyPrefix) {
        if (keyPrefix == null) {
            return "";
        }
        return keyPrefix.replaceAll("^/+|/+$", "");
    }

    private static String keepManagedKeyOrNull(String key, String normalizedPrefix) {
        if (key == null || key.isBlank()) {
            return null;
        }
        String trimmed = key.trim();
        if (normalizedPrefix.isBlank()) {
            return trimmed;
        }
        if (trimmed.equals(normalizedPrefix) || trimmed.startsWith(normalizedPrefix + "/")) {
            return trimmed;
        }
        return null;
    }
}
