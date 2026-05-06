package com.beverage.auth.infrastructure.persistence.mapper;

import com.beverage.auth.domain.entity.LoginHistory;
import com.beverage.auth.infrastructure.persistence.entity.LoginHistoryEntity;
import org.springframework.stereotype.Component;

@Component
public class LoginHistoryMapper {

    public LoginHistory toDomain(LoginHistoryEntity entity) {
        if (entity == null) return null;
        return LoginHistory.builder()
                .id(entity.getId())
                .userId(entity.getUserId())
                .ipAddress(entity.getIpAddress())
                .deviceInfo(entity.getDeviceInfo())
                .loginStatus(LoginHistory.LoginStatus.valueOf(entity.getLoginStatus()))
                .createdAt(entity.getCreatedAt())
                .build();
    }

    public LoginHistoryEntity toEntity(LoginHistory loginHistory) {
        if (loginHistory == null) return null;
        return LoginHistoryEntity.builder()
                .id(loginHistory.getId())
                .userId(loginHistory.getUserId())
                .ipAddress(loginHistory.getIpAddress())
                .deviceInfo(loginHistory.getDeviceInfo())
                .loginStatus(loginHistory.getLoginStatus().name())
                .createdAt(loginHistory.getCreatedAt())
                .build();
    }
}
