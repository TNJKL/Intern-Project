package com.beverage.inventory.infrastructure.security;

import com.beverage.shared.jwt.BaseJwtAuthenticationFilter;
import com.beverage.shared.jwt.JwtTokenProvider;
import com.beverage.shared.jwt.TokenSecurityStateService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtAuthenticationFilter extends BaseJwtAuthenticationFilter {

    public JwtAuthenticationFilter(
            JwtTokenProvider jwtTokenProvider,
            TokenSecurityStateService tokenSecurityStateService,
            @Value("${auth.access-cookie.name:accessToken}") String accessCookieName
    ) {
        super(jwtTokenProvider, tokenSecurityStateService, accessCookieName);
    }
}
