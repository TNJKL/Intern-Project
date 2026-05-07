package com.beverage.product.infrastructure.security;

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

