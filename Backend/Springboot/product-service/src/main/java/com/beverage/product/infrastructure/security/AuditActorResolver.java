package com.beverage.product.infrastructure.security;

import com.beverage.shared.jwt.JwtUserPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Lấy "subject" audit từ JWT: {@link JwtUserPrincipal#getUserId()} (chuẩn hóa dạng string).
 * Khớp với cách auth-service gắn principal — tương đương claim {@code sub} nếu sub là user id.
 */
@Component
public class AuditActorResolver {

    public Optional<String> currentActorId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return Optional.empty();
        }
        Object principal = auth.getPrincipal();
        if (principal instanceof JwtUserPrincipal jwt) {
            return Optional.of(jwt.getUserId().toString());
        }
        if ("anonymousUser".equals(principal)) {
            return Optional.empty();
        }
        return Optional.ofNullable(auth.getName()).filter(s -> !s.isBlank());
    }
}
