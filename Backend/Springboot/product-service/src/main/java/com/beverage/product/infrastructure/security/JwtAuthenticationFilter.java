package com.beverage.product.infrastructure.security;

import com.beverage.shared.jwt.BaseJwtAuthenticationFilter;
import com.beverage.shared.jwt.JwtTokenProvider;
import com.beverage.shared.jwt.TokenSecurityStateService;
import org.springframework.stereotype.Component;

@Component
public class JwtAuthenticationFilter extends BaseJwtAuthenticationFilter {

    public JwtAuthenticationFilter(
            JwtTokenProvider jwtTokenProvider,
            TokenSecurityStateService tokenSecurityStateService
    ) {
        super(jwtTokenProvider, tokenSecurityStateService);
    }
}

