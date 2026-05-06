package com.beverage.auth.infrastructure.persistence.mapper;

import com.beverage.auth.domain.entity.Session;
import com.beverage.auth.infrastructure.persistence.entity.SessionEntity;
import org.springframework.stereotype.Component;

@Component
public class SessionMapper {

    public Session toDomain(SessionEntity entity) {
        if (entity == null) return null;
        return Session.builder()
                .id(entity.getId())
                .userId(entity.getUserId())
                .tokenHash(entity.getTokenHash())
                .deviceInfo(entity.getDeviceInfo())
                .ipAddress(entity.getIpAddress())
                .expiresAt(entity.getExpiresAt())
                .isActive(entity.getIsActive())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    public SessionEntity toEntity(Session session) {
        if (session == null) return null;
        return SessionEntity.builder()
                .id(session.getId())
                .userId(session.getUserId())
                .tokenHash(session.getTokenHash())
                .deviceInfo(session.getDeviceInfo())
                .ipAddress(session.getIpAddress())
                .expiresAt(session.getExpiresAt())
                .isActive(session.getIsActive())
                .createdAt(session.getCreatedAt())
                .build();
    }
}
