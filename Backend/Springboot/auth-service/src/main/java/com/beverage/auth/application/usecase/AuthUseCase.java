package com.beverage.auth.application.usecase;

import com.beverage.auth.application.dto.request.LoginRequest;
import com.beverage.auth.application.dto.request.LogoutRequest;
import com.beverage.auth.application.dto.request.RefreshTokenRequest;
import com.beverage.auth.application.dto.request.RegisterRequest;
import com.beverage.auth.application.dto.response.AuthResponse;
import com.beverage.auth.application.dto.response.UserResponse;
import com.beverage.auth.application.mapper.UserMapper;
import com.beverage.auth.domain.entity.*;
import com.beverage.auth.domain.enums.UserRole;
import com.beverage.auth.domain.exception.AuthException;
import com.beverage.auth.domain.repository.LoginHistoryRepository;
import com.beverage.auth.domain.repository.RefreshTokenRepository;
import com.beverage.auth.domain.repository.SessionRepository;
import com.beverage.auth.domain.repository.UserRepository;
import com.beverage.auth.infrastructure.cache.RedisCacheService;
import com.beverage.auth.infrastructure.security.AuthRedisService;
import com.beverage.auth.infrastructure.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthUseCase {
    private static final long LOGIN_LIMIT_MAX_REQUESTS = 10;
    private static final long LOGIN_LIMIT_WINDOW_SECONDS = 60;
    private static final long REFRESH_LIMIT_MAX_REQUESTS = 20;
    private static final long REFRESH_LIMIT_WINDOW_SECONDS = 60;

    private final UserRepository userRepository;
    private final SessionRepository sessionRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final LoginHistoryRepository loginHistoryRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthRedisService authRedisService;
    private final RedisCacheService redisCacheService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AuthException("Email đã tồn tại trong hệ thống", "EMAIL_EXISTED");
        }

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .role(UserRole.CUSTOMER)
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        User savedUser = userRepository.save(user);
        log.info("User registered successfully: {}", savedUser.getEmail());

        return generateAuthResponse(savedUser, null, null);
    }

    @Transactional
    public AuthResponse login(LoginRequest request, String ipAddress, String deviceInfo) {
        String loginRateLimitKey = "auth:login:" + request.getEmail().toLowerCase();
        if (authRedisService.isRateLimitExceeded(loginRateLimitKey, LOGIN_LIMIT_MAX_REQUESTS, LOGIN_LIMIT_WINDOW_SECONDS)) {
            log.warn("SECURITY_EVENT type=RATE_LIMIT_EXCEEDED action=LOGIN key={} limit={} windowSeconds={}",
                    loginRateLimitKey, LOGIN_LIMIT_MAX_REQUESTS, LOGIN_LIMIT_WINDOW_SECONDS);
            throw new AuthException("Bạn thao tác đăng nhập quá nhanh, vui lòng thử lại sau", "RATE_LIMIT_EXCEEDED");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(AuthException.InvalidCredentialsException::new);

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            saveLoginHistory(user.getId(), ipAddress, deviceInfo, LoginHistory.LoginStatus.FAILED);
            throw new AuthException.InvalidCredentialsException();
        }

        if (!user.getIsActive()) {
            throw new AuthException.UserInactiveException();
        }

        if (authRedisService.isUserBanned(user.getId())) {
            throw new AuthException.UserBannedException();
        }

        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        saveSession(user.getId(), accessToken, ipAddress, deviceInfo);
        saveRefreshToken(user.getId(), refreshToken);
        saveLoginHistory(user.getId(), ipAddress, deviceInfo, LoginHistory.LoginStatus.SUCCESS);

        log.info("User logged in successfully: {}", user.getEmail());
        return generateAuthResponse(user, accessToken, refreshToken);
    }

    @Transactional
    public void logout(LogoutRequest request) {
        String accessToken = request.getAccessToken();
        String refreshToken = request.getRefreshToken();

        boolean revokedRefresh = false;
        if (refreshToken != null && !refreshToken.isBlank() && jwtService.validateToken(refreshToken)) {
            String refreshJti = jwtService.extractJti(refreshToken);
            long refreshTtl = jwtService.extractRemainingTtlSeconds(refreshToken);
            authRedisService.markRefreshTokenUsed(refreshJti, refreshTtl);
            log.info("SECURITY_EVENT type=TOKEN_REVOKED tokenType=REFRESH reason=LOGOUT jti={} ttlSeconds={}",
                    refreshJti, refreshTtl);

            refreshTokenRepository.findByTokenHash(refreshJti).ifPresent(refresh -> {
                refresh.revoke();
                refreshTokenRepository.save(refresh);
            });
            revokedRefresh = true;
        }

        Optional<JwtService.LogoutAccessParse> accessForLogout = jwtService.parseAccessTokenForLogout(accessToken);
        if (accessForLogout.isPresent()) {
            JwtService.LogoutAccessParse p = accessForLogout.get();
            authRedisService.blacklistToken(p.jti(), p.blacklistTtlSeconds());
            log.info("SECURITY_EVENT type=TOKEN_REVOKED tokenType=ACCESS reason=LOGOUT jti={} ttlSeconds={}",
                    p.jti(), p.blacklistTtlSeconds());

            sessionRepository.findByTokenHash(p.jti()).ifPresent(session -> {
                authRedisService.removeSessionFromUser(session.getUserId(), session.getId().toString());
                sessionRepository.deleteById(session.getId());
            });
        }

        if (!revokedRefresh && accessForLogout.isEmpty()) {
            log.warn("Logout rejected: không parse được access và refresh không hợp lệ hoặc thiếu");
            throw new AuthException.AccessTokenInvalidException();
        }

        log.info("User logged out successfully");
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();

        if (!jwtService.validateToken(refreshToken)) {
            throw new AuthException.RefreshTokenInvalidException();
        }

        if (!"refresh".equals(jwtService.extractTokenType(refreshToken))) {
            throw new AuthException.RefreshTokenInvalidException();
        }

        String refreshJti = jwtService.extractJti(refreshToken);
        if (authRedisService.isRefreshTokenUsed(refreshJti)) {
            log.warn("SECURITY_EVENT type=REFRESH_REPLAY_BLOCKED jti={} reason=ALREADY_USED", refreshJti);
            throw new AuthException.RefreshTokenUsedException();
        }

        RefreshToken storedRefreshToken = refreshTokenRepository.findByTokenHash(refreshJti)
                .orElseThrow(AuthException.RefreshTokenInvalidException::new);
        if (!storedRefreshToken.isValid()) {
            throw new AuthException.RefreshTokenInvalidException();
        }

        UUID userId = jwtService.extractUserId(refreshToken);
        String refreshRateLimitKey = "auth:refresh:" + userId;
        if (authRedisService.isRateLimitExceeded(refreshRateLimitKey, REFRESH_LIMIT_MAX_REQUESTS, REFRESH_LIMIT_WINDOW_SECONDS)) {
            log.warn("SECURITY_EVENT type=RATE_LIMIT_EXCEEDED action=REFRESH key={} userId={} limit={} windowSeconds={}",
                    refreshRateLimitKey, userId, REFRESH_LIMIT_MAX_REQUESTS, REFRESH_LIMIT_WINDOW_SECONDS);
            throw new AuthException("Bạn làm mới token quá nhanh, vui lòng thử lại sau", "RATE_LIMIT_EXCEEDED");
        }

        if (authRedisService.isUserBanned(userId)) {
            throw new AuthException.UserBannedException();
        }

        User user = userRepository.findById(userId)
                .orElseThrow(AuthException.RefreshTokenInvalidException::new);

        if (!user.getIsActive()) {
            throw new AuthException.UserInactiveException();
        }

        long refreshTtl = jwtService.extractRemainingTtlSeconds(refreshToken);
        authRedisService.markRefreshTokenUsed(refreshJti, refreshTtl);
        log.info("SECURITY_EVENT type=TOKEN_ROTATED tokenType=REFRESH oldJti={} ttlSeconds={} userId={}",
                refreshJti, refreshTtl, userId);

        storedRefreshToken.revoke();
        refreshTokenRepository.save(storedRefreshToken);

        String newAccessToken = jwtService.generateAccessToken(user);
        String newRefreshToken = jwtService.generateRefreshToken(user);

        saveRefreshToken(userId, newRefreshToken);

        log.info("Token refreshed successfully for user: {}", user.getEmail());
        return generateAuthResponse(user, newAccessToken, newRefreshToken);
    }

    public UserResponse getCurrentUser(UUID userId) {
        String cacheKey = redisCacheService.getUserCacheKey(userId.toString());
        UserResponse cachedUser = redisCacheService.get(cacheKey, UserResponse.class);

        if (cachedUser != null) {
            return cachedUser;
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AuthException("User not found", "USER_NOT_FOUND"));
        UserResponse response = userMapper.toResponse(user);
        redisCacheService.set(cacheKey, response);

        return response;
    }

    private AuthResponse generateAuthResponse(User user, String accessToken, String refreshToken) {
        UserResponse userResponse = userMapper.toResponse(user);
        return AuthResponse.of(
                accessToken,
                refreshToken,
                jwtService.getAccessTokenExpiration() / 1000,
                userResponse
        );
    }

    private void saveSession(UUID userId, String token, String ipAddress, String deviceInfo) {
        String jti = jwtService.extractJti(token);

        sessionRepository.findByTokenHash(jti).ifPresent(existingSession -> {
            authRedisService.removeSessionFromUser(userId, existingSession.getId().toString());
            sessionRepository.deleteById(existingSession.getId());
        });

        Session session = Session.builder()
                .userId(userId)
                .tokenHash(jti)
                .deviceInfo(deviceInfo)
                .ipAddress(ipAddress)
                .expiresAt(LocalDateTime.now().plusSeconds(jwtService.getAccessTokenExpiration() / 1000))
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .build();

        Session savedSession = sessionRepository.save(session);
        authRedisService.addSessionToUser(userId, savedSession.getId().toString());
    }

    private void saveRefreshToken(UUID userId, String token) {
        String jti = jwtService.extractJti(token);

        refreshTokenRepository.findByTokenHash(jti).ifPresent(existingToken -> {
            refreshTokenRepository.deleteById(existingToken.getId());
        });

        RefreshToken refreshToken = RefreshToken.builder()
                .userId(userId)
                .tokenHash(jti)
                .expiresAt(LocalDateTime.now().plusSeconds(jwtService.getRefreshTokenExpiration() / 1000))
                .isRevoked(false)
                .createdAt(LocalDateTime.now())
                .build();

        refreshTokenRepository.save(refreshToken);
    }

    private void saveLoginHistory(UUID userId, String ipAddress, String deviceInfo, LoginHistory.LoginStatus status) {
        LoginHistory loginHistory = LoginHistory.builder()
                .userId(userId)
                .ipAddress(ipAddress)
                .deviceInfo(deviceInfo)
                .loginStatus(status)
                .createdAt(LocalDateTime.now())
                .build();

        loginHistoryRepository.save(loginHistory);
    }
}
