# SERVICE ONBOARDING CHECKLIST (shared-jwt)

Checklist nay dung khi them 1 service moi can verify JWT.

## 1) Dependency

- [ ] Them dependency `shared-jwt` vao `pom.xml` cua service.
- [ ] Dam bao service build duoc khi chay `mvn -DskipTests compile`.

## 2) Implement contracts

- [ ] Tao `JwtService implements JwtTokenProvider`:
  - [ ] `validateToken`
  - [ ] `extractJti`
  - [ ] `extractUserId`
  - [ ] `extractEmail`
  - [ ] `extractRole`

- [ ] Tao `AuthRedisService implements TokenSecurityStateService`:
  - [ ] `isTokenBlacklisted`
  - [ ] `isUserBanned`

## 3) Filter adapter

- [ ] Tao class:

```java
@Component
public class JwtAuthenticationFilter extends BaseJwtAuthenticationFilter {
    public JwtAuthenticationFilter(
            JwtTokenProvider jwtTokenProvider,
            TokenSecurityStateService tokenSecurityStateService
    ) {
        super(jwtTokenProvider, tokenSecurityStateService);
    }
}
```

## 4) SecurityConfig

- [ ] Inject `JwtAuthenticationFilter`.
- [ ] Gan filter:
  - [ ] `.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)`
- [ ] Define endpoint public/private ro rang.
- [ ] Define role rule theo nghiep vu service.

## 5) Runtime config

- [ ] Co cau hinh `jwt.secret-key`.
- [ ] Co cau hinh Redis host/port dung moi truong.
- [ ] Dam bao service doc dung claim role (`ROLE_ADMIN`, `ROLE_CUSTOMER`, ...).

## 6) Smoke test bat buoc

- [ ] Request public endpoint khong token -> OK.
- [ ] Request private endpoint khong token -> 401/403 dung ky vong.
- [ ] Token hop le + role dung -> pass.
- [ ] Token bi blacklist -> bi chan.
- [ ] User bi ban -> bi chan.

## 7) Ghi chu kien truc

- `shared-jwt` chi phuc vu request-time verification.
- `refresh:used` la auth-only flow, dat o `auth-service`.
- Khi he thong on dinh, co the them global filter o gateway (lop ngoai),
  nhung service van giu filter noi bo (lop trong) de defense-in-depth.
