# shared-storage

Thư viện Maven dùng chung: **Amazon S3** qua AWS SDK v2 + Spring Boot auto-configuration.

## Cách dùng trong bất kỳ Spring Boot service

1. Thêm dependency (parent reactor đã có module):

```xml
<dependency>
  <groupId>com.beverage</groupId>
  <artifactId>shared-storage</artifactId>
  <version>0.0.1-SNAPSHOT</version>
</dependency>
```

2. Cài đặt (ví dụ `application.yml`):

```yaml
beverage:
  storage:
    s3:
      enabled: true
      bucket: ${AWS_S3_BUCKET}
      region: ${AWS_REGION:ap-southeast-1}
      key-prefix: ${AWS_S3_KEY_PREFIX:beverage/dev}
      max-bytes: 5242880
      public-base-url: ${AWS_S3_PUBLIC_BASE_URL:}
```

3. **Credential**: SDK dùng `DefaultCredentialsProvider` — biến môi trường `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`, hoặc profile `~/.aws/credentials`, hoặc IAM role trên EC2/ECS.

4. Inject:

```java
private final ObjectStorageService objectStorageService;
```

5. Gọi:

```java
UploadedObject o = objectStorageService.putImage("products", "image/png", bytes);
// o.publicUrl() -> lưu DB; o.key() -> nếu muốn lưu key thay vì full URL
```

## Khi `enabled: false`

Không tạo bean S3 — service vẫn chạy (upload API nên `@ConditionalOnBean(ObjectStorageService)` hoặc tắt route).

## Bucket policy

Để `publicUrl` mở được trong trình duyệt, object/bucket cần **GetObject** public hoặc dùng **CloudFront** + `public-base-url`.
