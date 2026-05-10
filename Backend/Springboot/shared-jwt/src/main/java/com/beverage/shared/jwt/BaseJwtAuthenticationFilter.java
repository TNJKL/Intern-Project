package com.beverage.shared.jwt;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Slf4j
public class BaseJwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final TokenSecurityStateService tokenSecurityStateService;
    private final String accessCookieName;

    public BaseJwtAuthenticationFilter(
            JwtTokenProvider jwtTokenProvider,
            TokenSecurityStateService tokenSecurityStateService
    ) {
        this(jwtTokenProvider, tokenSecurityStateService, "accessToken");
    }

    public BaseJwtAuthenticationFilter(
            JwtTokenProvider jwtTokenProvider,
            TokenSecurityStateService tokenSecurityStateService,
            String accessCookieName
    ) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.tokenSecurityStateService = tokenSecurityStateService;
        this.accessCookieName = accessCookieName;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        try {
            String token = extractToken(request);

            if (token != null && jwtTokenProvider.validateToken(token)) {
                String jti = jwtTokenProvider.extractJti(token);
                UUID userId = jwtTokenProvider.extractUserId(token);
                String role = jwtTokenProvider.extractRole(token);

                if (tokenSecurityStateService.isTokenBlacklisted(jti)) {
                    log.debug("Token is blacklisted: {}", jti);
                    filterChain.doFilter(request, response);
                    return;
                }

                if (tokenSecurityStateService.isUserBanned(userId)) {
                    log.debug("User is banned: {}", userId);
                    filterChain.doFilter(request, response);
                    return;
                }

                JwtUserPrincipal principal = new JwtUserPrincipal(
                        userId,
                        jwtTokenProvider.extractEmail(token),
                        role
                );

                List<SimpleGrantedAuthority> authorities = List.of(
                        new SimpleGrantedAuthority("ROLE_" + role)
                );

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(principal, null, authorities);
                SecurityContextHolder.getContext().setAuthentication(authentication);
                log.debug("Authenticated user: {}", userId);
            }
        } catch (Exception e) {
            log.error("Cannot set user authentication: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        // Backward-compatible priority: Authorization header first.
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }

        // Dual mode: fallback to HttpOnly access-token cookie.
        Cookie[] cookies = request.getCookies();
        if (cookies == null || cookies.length == 0) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (accessCookieName.equals(cookie.getName()) && StringUtils.hasText(cookie.getValue())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
