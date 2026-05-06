package com.beverage.auth.infrastructure.security;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor
public class JwtUserPrincipal {
    private UUID userId;
    private String email;
    private String role;
}
