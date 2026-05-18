# shared-jwt

Module dung chung cho JWT verification trong cac service business.

## Muc tieu

- Tranh copy/paste `JwtAuthenticationFilter` giua cac service.
- Chuan hoa flow xac thuc JWT: parse token, check blacklist, check banned user, set SecurityContext.
- De mo rong nhanh service moi (order-service, inventory-service, payment-service, ...).

## Thanh phan chinh

- `JwtTokenProvider`
  - Contract de service cung cap logic validate token va extract claims.
- `TokenSecurityStateService`
  - Contract de service cung cap logic check:
    - token co bi blacklist khong
    - user co bi ban khong
- `BaseJwtAuthenticationFilter`
  - Filter dung chung cho cac service.
- `JwtUserPrincipal`
  - Principal dung chung trong SecurityContext.

## Luu y quan trong

- `shared-jwt` KHONG chua logic `refresh:used:*`.
- Ly do: `refresh:used` chi thuoc auth-flow (`/api/v1/auth/refresh`), khong thuoc request-time verification cua moi service.
- Logic `refresh:used` tiep tuc dat trong `auth-service` (vd `AuthRedisService`).

## Mau tich hop cho service moi

1. Them dependency:

```xml
<dependency>
    <groupId>com.beverage</groupId>
    <artifactId>shared-jwt</artifactId>
    <version>0.0.1-SNAPSHOT</version>
</dependency>
```

2. Tao `JwtService` implement `JwtTokenProvider`.
3. Tao `AuthRedisService` implement `TokenSecurityStateService`.
4. Tao `JwtAuthenticationFilter` extends `BaseJwtAuthenticationFilter`.
5. Wire vao `SecurityConfig` bang `addFilterBefore(...)`.
6. Cau hinh route public/private va role cho service do.

Xem checklist chi tiet trong file `SERVICE_ONBOARDING_CHECKLIST.md`.
