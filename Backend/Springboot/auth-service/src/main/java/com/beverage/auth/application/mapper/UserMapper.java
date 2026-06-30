package com.beverage.auth.application.mapper;

import com.beverage.auth.application.dto.request.CreateUserRequest;
import com.beverage.auth.application.dto.request.UpdateUserRequest;
import com.beverage.auth.application.dto.response.UserResponse;
import com.beverage.auth.domain.entity.User;
import com.beverage.auth.domain.enums.UserRole;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Mapper giữa DTO và Domain Entity
 */
@Component
public class UserMapper {

    public UserResponse toResponse(User user) {
        if (user == null) return null;

        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole())
                .isActive(user.getIsActive())
                .addresses(user.getAddresses())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    public User toDomain(CreateUserRequest request) {
        if (request == null) return null;

        return User.builder()
                .email(request.getEmail())
                .passwordHash(request.getPassword())
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .avatarUrl(request.getAvatarUrl())
                .role(request.getRole() != null ? request.getRole() : UserRole.CUSTOMER)
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    public void updateDomain(User user, UpdateUserRequest request) {
        if (request == null) return;

        if (request.getEmail() != null) {
            user.setEmail(request.getEmail());
        }
        if (request.getPassword() != null) {
            user.setPasswordHash(request.getPassword());
        }
        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }
        if (request.getRole() != null) {
            user.setRole(request.getRole());
        }
        if (request.getIsActive() != null) {
            user.setIsActive(request.getIsActive());
        }
        if (request.getAddresses() != null) {
            user.setAddresses(request.getAddresses());
        }
        user.setUpdatedAt(LocalDateTime.now());
    }
}
