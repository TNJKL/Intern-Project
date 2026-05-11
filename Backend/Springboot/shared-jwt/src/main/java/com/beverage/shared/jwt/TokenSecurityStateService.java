package com.beverage.shared.jwt;

import java.util.UUID;

public interface TokenSecurityStateService {
    boolean isTokenBlacklisted(String jti);
    boolean isUserBanned(UUID userId);
}
