package com.beverage.auth.application.usecase;

import com.beverage.auth.application.dto.request.CreateUserRequest;
import com.beverage.auth.application.dto.request.UpdateUserRequest;
import com.beverage.auth.application.dto.response.UserResponse;
import com.beverage.auth.application.mapper.UserMapper;
import com.beverage.auth.domain.entity.User;
import com.beverage.auth.domain.exception.BusinessException;
import com.beverage.auth.domain.exception.ResourceNotFoundException;
import com.beverage.auth.domain.repository.UserRepository;
import com.beverage.auth.infrastructure.cache.RedisCacheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Use Case - Application Layer
 * Xử lý business logic, giao tiếp với Domain và Infrastructure
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserUseCase {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final RedisCacheService redisCacheService;

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Email đã tồn tại trong hệ thống", "EMAIL_EXISTED");
        }

        User user = userMapper.toDomain(request);
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
        User updatedUser = userRepository.save(user);

        // Invalidate cache
        redisCacheService.delete(redisCacheService.getUserCacheKey(id.toString()));
        redisCacheService.delete(redisCacheService.getUserByEmailCacheKey(user.getEmail()));

        log.info("Updated user with id: {}", id);
        return userMapper.toResponse(updatedUser);
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
