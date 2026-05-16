package com.beverage.shared.jwt;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor
public class JwtUserPrincipal {
    private UUID userId;
    private String email;
    private String role;
    /** Tên hiển thị từ JWT (fullName); fallback email nếu null — set trong BaseJwtAuthenticationFilter. */
    private String fullName;

    public JwtUserPrincipal(UUID userId, String email, String role) {
        this(userId, email, role, null);
    }
}
