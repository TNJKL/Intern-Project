package com.beverage.inventory.infrastructure.security;

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

/**
 * SEC-01: Bảo vệ endpoint /check-availability khỏi gọi từ bên ngoài.
 *
 * <p>Endpoint này chỉ được phép gọi từ internal service (order-service),
 * không được expose qua API Gateway. Filter kiểm tra header
 * {@code X-Internal-Secret} phải khớp với giá trị cấu hình.</p>
 *
 * <p>Cách hoạt động:
 * <ul>
 *   <li>Chỉ áp dụng với path {@code /api/v1/inventory/check-availability}</li>
 *   <li>Nếu header {@code X-Internal-Secret} đúng → tiếp tục xử lý</li>
 *   <li>Nếu sai hoặc thiếu → trả về 403 Forbidden</li>
 * </ul>
 * </p>
 */
@Component
@Slf4j
public class InternalRequestFilter extends OncePerRequestFilter {

    private static final String INTERNAL_SECRET_HEADER = "X-Internal-Secret";
    private static final String CHECK_AVAILABILITY_PATH = "/api/v1/inventory/check-availability";

    @Value("${app.internal.secret:internal-beverage-secret-2024}")
    private String internalSecret;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        String requestPath = request.getRequestURI();

        if (CHECK_AVAILABILITY_PATH.equals(requestPath)) {
            String providedSecret = request.getHeader(INTERNAL_SECRET_HEADER);

            if (providedSecret == null || !providedSecret.equals(internalSecret)) {
                log.warn("SEC-01: Blocked unauthorized access to {} from IP={} — missing or invalid {}",
                        CHECK_AVAILABILITY_PATH,
                        request.getRemoteAddr(),
                        INTERNAL_SECRET_HEADER);
                response.setStatus(HttpStatus.FORBIDDEN.value());
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write(
                        "{\"success\":false,\"message\":\"Truy cập bị từ chối: endpoint nội bộ\"}"
                );
                return;
            }

            log.debug("SEC-01: Internal request to {} authorized from IP={}",
                    CHECK_AVAILABILITY_PATH, request.getRemoteAddr());
        }

        filterChain.doFilter(request, response);
    }
}
