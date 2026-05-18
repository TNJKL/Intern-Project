package com.beverage.product.presentation.support;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class CatalogAdminApiSupport {

    public void assertAdminWhenIncludingDeleted(boolean includeDeleted, Authentication authentication) {
        if (!includeDeleted) {
            return;
        }
        if (authentication == null || !hasAdminRole(authentication)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ ADMIN mới được dùng includeDeleted=true.");
        }
    }

    private boolean hasAdminRole(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch("ROLE_ADMIN"::equals);
    }
}
