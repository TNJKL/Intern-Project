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
import com.beverage.auth.infrastructure.security.JwtUserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Authentication APIs")
public class AuthController {

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
            HttpServletRequest httpRequest) {
        String ipAddress = getClientIp(httpRequest);
        String deviceInfo = httpRequest.getHeader("User-Agent");
        AuthResponse response = authUseCase.login(request, ipAddress, deviceInfo);
        return ResponseEntity.ok(ApiResponse.success(response, "Đăng nhập thành công"));
    }

    @PostMapping("/logout")
    @Operation(summary = "User logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @Valid @RequestBody LogoutRequest request) {
        authUseCase.logout(request);
        return ResponseEntity.ok(ApiResponse.success(null, "Đăng xuất thành công"));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authUseCase.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Làm mới token thành công"));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user info")
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
}
