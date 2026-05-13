package com.beverage.auth.presentation.controller;

import com.beverage.auth.application.dto.request.LoginRequest;
import com.beverage.auth.application.dto.request.LogoutRequest;
import com.beverage.auth.application.dto.request.RefreshTokenRequest;
import com.beverage.auth.application.dto.request.RegisterRequest;
import com.beverage.auth.application.dto.response.AuthResponse;
import com.beverage.auth.application.dto.response.UserResponse;
import com.beverage.auth.application.usecase.AuthUseCase;
import com.beverage.auth.common.ApiResponse;
import com.beverage.auth.domain.exception.AuthException;
import com.beverage.shared.jwt.JwtUserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Authentication APIs")
public class AuthController {

    @Value("${auth.refresh-cookie.name:refreshToken}")
    private String refreshCookieName;

    @Value("${auth.refresh-cookie.path:/api/v1/auth}")
    private String refreshCookiePath;

    @Value("${auth.refresh-cookie.secure:false}")
    private boolean refreshCookieSecure;

    @Value("${auth.refresh-cookie.same-site:Lax}")
    private String refreshCookieSameSite;

    @Value("${auth.access-cookie.name:accessToken}")
    private String accessCookieName;

    @Value("${auth.access-cookie.path:/}")
    private String accessCookiePath;

    @Value("${auth.access-cookie.secure:false}")
    private boolean accessCookieSecure;

    @Value("${auth.access-cookie.same-site:Lax}")
    private String accessCookieSameSite;

    @Value("${jwt.access-token-expiration:900000}")
    private long accessTokenExpirationMs;

    @Value("${jwt.refresh-token-expiration:604800000}")
    private long refreshTokenExpirationMs;

    private final AuthUseCase authUseCase;

    @PostMapping("/register")
    @Operation(summary = "Register new user")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authUseCase.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Đăng ký thành công"));
    }

    @PostMapping("/login")
    @Operation(summary = "User login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        String ipAddress = getClientIp(httpRequest);
        String deviceInfo = httpRequest.getHeader("User-Agent");
        AuthResponse response = authUseCase.login(request, ipAddress, deviceInfo);

        addAccessTokenCookie(httpResponse, response.getAccessToken());
        addRefreshTokenCookie(httpResponse, response.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.success(response, "Đăng nhập thành công"));
    }

    @PostMapping("/logout")
    @Operation(summary = "User logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @RequestBody(required = false) LogoutRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        String accessToken = resolveAccessToken(request, httpRequest);
        String refreshToken = resolveRefreshToken(request, httpRequest);
        if (!StringUtils.hasText(accessToken) && !StringUtils.hasText(refreshToken)) {
            throw new AuthException("Thiếu access token hoặc refresh token", "TOKEN_MISSING");
        }

        LogoutRequest resolved = LogoutRequest.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();

        clearAccessTokenCookie(httpResponse);
        clearRefreshTokenCookie(httpResponse);
        authUseCase.logout(resolved);
        return ResponseEntity.ok(ApiResponse.success(null, "Đăng xuất thành công"));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @RequestBody(required = false) RefreshTokenRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        String refreshToken = resolveRefreshToken(request, httpRequest);
        if (!StringUtils.hasText(refreshToken)) {
            throw new AuthException.RefreshTokenInvalidException();
        }

        RefreshTokenRequest resolved = RefreshTokenRequest.builder()
                .refreshToken(refreshToken)
                .build();

        AuthResponse response = authUseCase.refreshToken(resolved);
        addAccessTokenCookie(httpResponse, response.getAccessToken());
        addRefreshTokenCookie(httpResponse, response.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.success(response, "Làm mới token thành công"));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user info (deprecated)", deprecated = true)
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new AuthException("Token không hợp lệ hoặc thiếu token", "REFRESH_TOKEN_INVALID");
        }

        UUID userId;
        Object principal = authentication.getPrincipal();
        if (principal instanceof JwtUserPrincipal jwtPrincipal) {
            userId = jwtPrincipal.getUserId();
        } else {
            try {
                userId = UUID.fromString(authentication.getName());
            } catch (IllegalArgumentException ex) {
                throw new AuthException("Token không hợp lệ", "REFRESH_TOKEN_INVALID");
            }
        }

        UserResponse response = authUseCase.getCurrentUser(userId);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy thông tin user thành công"));
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private String resolveAccessToken(LogoutRequest request, HttpServletRequest httpRequest) {
        if (request != null && StringUtils.hasText(request.getAccessToken())) {
            return request.getAccessToken();
        }

        String bearerToken = httpRequest.getHeader(HttpHeaders.AUTHORIZATION);
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return extractCookie(httpRequest, accessCookieName);
    }

    private String resolveRefreshToken(Object request, HttpServletRequest httpRequest) {
        // HttpOnly cookie trước: tránh Postman/client gửi body cũ ghi đè cookie hợp lệ.
        String fromCookie = extractCookie(httpRequest, refreshCookieName);
        if (StringUtils.hasText(fromCookie)) {
            return fromCookie;
        }
        if (request instanceof RefreshTokenRequest r && StringUtils.hasText(r.getRefreshToken())) {
            return r.getRefreshToken();
        }
        if (request instanceof LogoutRequest l && StringUtils.hasText(l.getRefreshToken())) {
            return l.getRefreshToken();
        }
        return null;
    }

    private String extractCookie(HttpServletRequest request, String cookieName) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null || cookies.length == 0) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (cookieName.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }

    private void addRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        if (!StringUtils.hasText(refreshToken)) {
            return;
        }

        ResponseCookie cookie = ResponseCookie.from(refreshCookieName, refreshToken)
                .httpOnly(false)
                .secure(refreshCookieSecure)
                .path(refreshCookiePath)
                .sameSite(refreshCookieSameSite)
                .maxAge(jwtSecondsToDurationSeconds())
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void addAccessTokenCookie(HttpServletResponse response, String accessToken) {
        if (!StringUtils.hasText(accessToken)) {
            return;
        }

        ResponseCookie cookie = ResponseCookie.from(accessCookieName, accessToken)
                .httpOnly(true)
                .secure(accessCookieSecure)
                .path(accessCookiePath)
                .sameSite(accessCookieSameSite)
                .maxAge(jwtAccessSecondsToDurationSeconds())
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearRefreshTokenCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(refreshCookieName, "")
                .httpOnly(true)
                .secure(refreshCookieSecure)
                .path(refreshCookiePath)
                .sameSite(refreshCookieSameSite)
                .maxAge(0)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearAccessTokenCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(accessCookieName, "")
                .httpOnly(true)
                .secure(accessCookieSecure)
                .path(accessCookiePath)
                .sameSite(accessCookieSameSite)
                .maxAge(0)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private long jwtAccessSecondsToDurationSeconds() {
        return Math.max(1, accessTokenExpirationMs / 1000);
    }

    private long jwtSecondsToDurationSeconds() {
        return Math.max(1, refreshTokenExpirationMs / 1000);
    }
}
