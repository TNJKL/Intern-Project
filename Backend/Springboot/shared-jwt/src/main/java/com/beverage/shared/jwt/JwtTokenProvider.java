package com.beverage.shared.jwt;

import java.util.UUID;

public interface JwtTokenProvider {
    boolean validateToken(String token);
    String extractJti(String token);
    UUID extractUserId(String token);
    String extractEmail(String token);
    String extractRole(String token);

    /** Claim tùy chọn (vd. auth-service set fullName). Service không dùng thì để mặc định null. */
    default String extractFullName(String token) {
        return null;
    }
}
