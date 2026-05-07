package com.beverage.auth.application.usecase;

import com.beverage.auth.application.dto.request.CreateUserRequest;
import com.beverage.auth.application.dto.request.UpdateUserRequest;
import com.beverage.auth.application.dto.response.UserResponse;
import com.beverage.auth.application.mapper.UserMapper;
import com.beverage.auth.domain.entity.User;
import com.beverage.auth.domain.exception.AuthException;
import com.beverage.auth.domain.exception.BusinessException;
import com.beverage.auth.domain.exception.ResourceNotFoundException;
import com.beverage.auth.domain.repository.RefreshTokenRepository;
import com.beverage.auth.domain.repository.SessionRepository;
import com.beverage.auth.domain.repository.UserRepository;
import com.beverage.auth.infrastructure.cache.RedisCacheService;
import com.beverage.auth.infrastructure.security.AuthRedisService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.UUID;

/**
 * Use Case - Application Layer
 * Xử lý business logic, giao tiếp với Domain và Infrastructure
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserUseCase {
    private static final long CHANGE_PASSWORD_LIMIT_MAX_REQUESTS = 5;
    private static final long CHANGE_PASSWORD_LIMIT_WINDOW_SECONDS = 900;

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final RedisCacheService redisCacheService;
    private final PasswordEncoder passwordEncoder;
    private final SessionRepository sessionRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AuthRedisService authRedisService;

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Email đã tồn tại trong hệ thống", "EMAIL_EXISTED");
        }

        User user = userMapper.toDomain(request);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        User savedUser = userRepository.save(user);

        log.info("Created new user with id: {}", savedUser.getId());
        return userMapper.toResponse(savedUser);
    }

    public UserResponse getUserById(UUID id) {
        String cacheKey = redisCacheService.getUserCacheKey(id.toString());
        UserResponse cachedUser = redisCacheService.get(cacheKey, UserResponse.class);

        if (cachedUser != null) {
            log.debug("User found in cache: {}", id);
            return cachedUser;
        }

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        UserResponse response = userMapper.toResponse(user);
        redisCacheService.set(cacheKey, response);

        return response;
    }

    public UserResponse getUserByEmail(String email) {
        String cacheKey = redisCacheService.getUserByEmailCacheKey(email);
        UserResponse cachedUser = redisCacheService.get(cacheKey, UserResponse.class);

        if (cachedUser != null) {
            log.debug("User found in cache by email: {}", email);
            return cachedUser;
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        UserResponse response = userMapper.toResponse(user);
        redisCacheService.set(cacheKey, response);

        return response;
    }

    public Page<UserResponse> getAllUsers(Pageable pageable) {
        Page<User> users = userRepository.findAll(pageable);
        return users.map(userMapper::toResponse);
    }

    public Page<UserResponse> getUsersByRole(String role, Pageable pageable) {
        Page<User> users = userRepository.findByRole(role, pageable);
        return users.map(userMapper::toResponse);
    }

    public Page<UserResponse> getUsersByActiveStatus(Boolean isActive, Pageable pageable) {
        Page<User> users = userRepository.findByIsActive(isActive, pageable);
        return users.map(userMapper::toResponse);
    }

    @Transactional
    public UserResponse updateUser(UUID id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new BusinessException("Email đã tồn tại trong hệ thống", "EMAIL_EXISTED");
            }
        }

        userMapper.updateDomain(user, request);
        if (StringUtils.hasText(request.getPassword())) {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }
        User updatedUser = userRepository.save(user);

        // Invalidate cache
        redisCacheService.delete(redisCacheService.getUserCacheKey(id.toString()));
        redisCacheService.delete(redisCacheService.getUserByEmailCacheKey(user.getEmail()));

        log.info("Updated user with id: {}", id);
        return userMapper.toResponse(updatedUser);
    }

    @Transactional
    public void changeMyPassword(UUID userId, String oldPassword, String newPassword) {
        String changePasswordRateLimitKey = "auth:change-password:" + userId;
        if (authRedisService.isRateLimitExceeded(changePasswordRateLimitKey, CHANGE_PASSWORD_LIMIT_MAX_REQUESTS, CHANGE_PASSWORD_LIMIT_WINDOW_SECONDS)) {
            log.warn("SECURITY_EVENT type=RATE_LIMIT_EXCEEDED action=CHANGE_PASSWORD key={} userId={} limit={} windowSeconds={}",
                    changePasswordRateLimitKey, userId, CHANGE_PASSWORD_LIMIT_MAX_REQUESTS, CHANGE_PASSWORD_LIMIT_WINDOW_SECONDS);
            throw new AuthException("Bạn đổi mật khẩu quá nhiều lần trong thời gian ngắn, vui lòng thử lại sau", "RATE_LIMIT_EXCEEDED");
        }

        if (oldPassword.equals(newPassword)) {
            throw new AuthException("Mật khẩu mới không được trùng mật khẩu hiện tại", "PASSWORD_UNCHANGED");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            throw new AuthException("Mật khẩu hiện tại không chính xác", "INVALID_CREDENTIALS");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(java.time.LocalDateTime.now());
        userRepository.save(user);

        // Thu hồi toàn bộ access token còn sống bằng cách blacklist theo session tokenHash (JTI)
        var sessions = sessionRepository.findByUserId(userId);
        for (var session : sessions) {
            if (session.getExpiresAt() == null || session.getTokenHash() == null) {
                continue;
            }
            long remainingTtl = java.time.Duration.between(java.time.LocalDateTime.now(), session.getExpiresAt()).getSeconds();
            if (remainingTtl > 0) {
                authRedisService.blacklistToken(session.getTokenHash(), remainingTtl);
                log.info("SECURITY_EVENT type=TOKEN_REVOKED tokenType=ACCESS reason=PASSWORD_CHANGED jti={} userId={} ttlSeconds={}",
                        session.getTokenHash(), userId, remainingTtl);
            }
        }

        // Thu hồi toàn bộ phiên đăng nhập + refresh token sau khi đổi mật khẩu
        sessionRepository.deleteByUserId(userId);
        refreshTokenRepository.deleteByUserId(userId);
        authRedisService.removeAllUserSessions(userId);
        redisCacheService.delete(redisCacheService.getUserCacheKey(userId.toString()));
        redisCacheService.delete(redisCacheService.getUserByEmailCacheKey(user.getEmail()));

        log.info("SECURITY_EVENT type=PASSWORD_CHANGED userId={} sessionsRevoked={} refreshRevoked=ALL", userId, sessions.size());
    }

    @Transactional
    public void deleteUser(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        userRepository.deleteById(id);

        // Invalidate cache
        redisCacheService.delete(redisCacheService.getUserCacheKey(id.toString()));
        redisCacheService.delete(redisCacheService.getUserByEmailCacheKey(user.getEmail()));

        log.info("Deleted user with id: {}", id);
    }
}
