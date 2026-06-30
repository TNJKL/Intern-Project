package com.beverage.auth.domain.entity;

import com.beverage.auth.domain.enums.UserRole;
import com.beverage.auth.domain.model.UserAddress;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Domain Entity - Không phụ thuộc framework nào
 * Chỉ chứa business logic và data structure thuần
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    private UUID id;
    private String email;
    private String passwordHash;
    private String fullName;
    private String phone;
    private String avatarUrl;
    private UserRole role;
    private Boolean isActive;

    @Builder.Default
    private List<UserAddress> addresses = new ArrayList<>();
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public void activate() {
        this.isActive = true;
        this.updatedAt = LocalDateTime.now();
    }

    public void deactivate() {
        this.isActive = false;
        this.updatedAt = LocalDateTime.now();
    }

    public void updateProfile(String fullName, String phone, String avatarUrl) {
        if (fullName != null) this.fullName = fullName;
        if (phone != null) this.phone = phone;
        if (avatarUrl != null) this.avatarUrl = avatarUrl;
        this.updatedAt = LocalDateTime.now();
    }

    public boolean isAdmin() {
        return this.role == UserRole.ADMIN;
    }

    public boolean isCustomer() {
        return this.role == UserRole.CUSTOMER;
    }
}
