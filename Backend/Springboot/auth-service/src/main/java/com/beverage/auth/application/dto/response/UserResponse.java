package com.beverage.auth.application.dto.response;

import com.beverage.auth.domain.enums.UserRole;
import com.beverage.auth.domain.model.UserAddress;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private UUID id;
    private String email;
    private String fullName;
    private String phone;
    private String avatarUrl;
    private UserRole role;
    private Boolean isActive;
    private List<UserAddress> addresses;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
