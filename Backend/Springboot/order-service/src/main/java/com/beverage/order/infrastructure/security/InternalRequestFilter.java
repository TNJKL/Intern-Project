package com.beverage.order.infrastructure.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Slf4j
public class InternalRequestFilter extends OncePerRequestFilter {

    private static final String INTERNAL_SECRET_HEADER = "X-Internal-Secret";
    private static final String INTERNAL_PATH_PREFIX = "/api/v1/internal/";

    @Value("${app.internal.secret:internal-beverage-secret-2024}")
    private String internalSecret;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        String requestPath = request.getRequestURI();

        if (requestPath.startsWith(INTERNAL_PATH_PREFIX)) {
            String providedSecret = request.getHeader(INTERNAL_SECRET_HEADER);

            if (providedSecret == null || !providedSecret.equals(internalSecret)) {
                log.warn("Blocked unauthorized access to {} from IP={} — missing or invalid {}",
                        requestPath,
                        request.getRemoteAddr(),
                        INTERNAL_SECRET_HEADER);
                response.setStatus(HttpStatus.FORBIDDEN.value());
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write(
                        "{\"success\":false,\"message\":\"Truy cập bị từ chối : endpoint nội bộ\"}"
                );
                return;
            }

            log.debug("Internal request to {} authorized from IP={}", requestPath, request.getRemoteAddr());
        }

        filterChain.doFilter(request, response);
    }
}
