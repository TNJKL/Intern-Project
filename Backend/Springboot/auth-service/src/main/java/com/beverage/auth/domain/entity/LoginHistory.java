package com.beverage.auth.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginHistory {

    private UUID id;
    private UUID userId;
    private String ipAddress;
    private String deviceInfo;
    private LoginStatus loginStatus;
    private LocalDateTime createdAt;

    public enum LoginStatus {
        SUCCESS, FAILED
    }
}
