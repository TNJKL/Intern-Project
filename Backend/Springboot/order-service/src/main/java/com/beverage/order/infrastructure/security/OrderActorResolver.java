package com.beverage.order.infrastructure.security;

import com.beverage.order.domain.exception.ForbiddenException;
import com.beverage.shared.jwt.JwtUserPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class OrderActorResolver {

    public JwtUserPrincipal requirePrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof JwtUserPrincipal principal)) {
            throw new ForbiddenException("Yêu cầu đăng nhập");
        }
        return principal;
    }

    public Optional<JwtUserPrincipal> getOptionalPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof JwtUserPrincipal principal) {
            return Optional.of(principal);
        }
        return Optional.empty();
    }

    public boolean isAdmin(JwtUserPrincipal principal) {
        return "ADMIN".equalsIgnoreCase(principal.getRole());
    }
}
