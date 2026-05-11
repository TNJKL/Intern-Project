package com.beverage.storage.autoconfigure;

import com.beverage.storage.StorageException;
import com.beverage.storage.api.ObjectStorageService;
import com.beverage.storage.internal.S3ObjectStorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;
import org.springframework.util.StringUtils;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

import java.util.Locale;
import java.util.regex.Pattern;

@AutoConfiguration
@ConditionalOnClass(S3Client.class)
@ConditionalOnProperty(prefix = "beverage.storage.s3", name = "enabled", havingValue = "true")
@EnableConfigurationProperties(BeverageStorageProperties.class)
public class BeverageStorageAutoConfiguration {

    private static final Logger log = LoggerFactory.getLogger(BeverageStorageAutoConfiguration.class);
    private static final Pattern S3_BUCKET_PATTERN = Pattern.compile("^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$");

    @Bean
    public S3Client beverageS3Client(BeverageStorageProperties properties, Environment environment) {
        normalizeProperties(properties);
        if (properties.getBucket() == null || properties.getBucket().isBlank()) {
            throw new StorageException(
                    "beverage.storage.s3.bucket chưa cấu hình — set AWS_S3_BUCKET hoặc beverage.storage.s3.bucket");
        }
        validateBucketName(properties.getBucket());
        log.info("shared-storage S3 config: bucket='{}', region='{}', keyPrefix='{}', publicBaseUrl='{}'",
                properties.getBucket(),
                properties.getRegion(),
                properties.getKeyPrefix(),
                properties.getPublicBaseUrl() == null ? "" : properties.getPublicBaseUrl());
        AwsCredentialsProvider credentials = resolveCredentials(environment);
        return S3Client.builder()
                .region(Region.of(properties.getRegion()))
                .credentialsProvider(credentials)
                .build();
    }

    /**
     * Ưu tiên key trong Spring Environment (từ .env qua spring.config.import hoặc biến hệ thống OS).
     * Nếu thiếu một trong hai, fallback chuỗi mặc định của AWS SDK (~/.aws/credentials, IAM role, ...).
     */
    private static AwsCredentialsProvider resolveCredentials(Environment environment) {
        String accessKey = environment.getProperty("AWS_ACCESS_KEY_ID");
        String secretKey = environment.getProperty("AWS_SECRET_ACCESS_KEY");
        if (StringUtils.hasText(accessKey) && StringUtils.hasText(secretKey)) {
            return StaticCredentialsProvider.create(
                    AwsBasicCredentials.create(accessKey.trim(), secretKey.trim()));
        }
        return DefaultCredentialsProvider.create();
    }

    @Bean
    public ObjectStorageService objectStorageService(S3Client beverageS3Client, BeverageStorageProperties properties) {
        return new S3ObjectStorageService(beverageS3Client, properties);
    }

    private static void normalizeProperties(BeverageStorageProperties properties) {
        properties.setBucket(trimToNull(properties.getBucket()));
        String region = trimToNull(properties.getRegion());
        properties.setRegion(region != null ? region : "ap-southeast-1");
        String keyPrefix = trimToNull(properties.getKeyPrefix());
        properties.setKeyPrefix(keyPrefix != null ? keyPrefix : "beverage/dev");
        properties.setPublicBaseUrl(trimToNull(properties.getPublicBaseUrl()));
    }

    private static String trimToNull(String input) {
        if (input == null) {
            return null;
        }
        String trimmed = input.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static void validateBucketName(String bucket) {
        String lower = bucket.toLowerCase(Locale.ROOT);
        if (bucket.startsWith("http://") || bucket.startsWith("https://") || bucket.contains("/")) {
            throw new StorageException("AWS_S3_BUCKET phải là tên bucket thuần, không phải URL/path: " + bucket);
        }
        if (!bucket.equals(lower)) {
            throw new StorageException("AWS_S3_BUCKET chỉ được chứa chữ thường: " + bucket);
        }
        if (!S3_BUCKET_PATTERN.matcher(bucket).matches()) {
            throw new StorageException("AWS_S3_BUCKET không hợp lệ theo chuẩn AWS S3: " + bucket);
        }
    }
}
