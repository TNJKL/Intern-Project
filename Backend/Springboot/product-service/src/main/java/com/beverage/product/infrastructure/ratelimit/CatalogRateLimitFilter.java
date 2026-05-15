package com.beverage.product.infrastructure.ratelimit;

import com.beverage.shared.jwt.JwtUserPrincipal;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Rate limit theo IP (khách) hoặc user id JWT (đã đăng nhập) — cửa sổ cố định + Redis INCR.
 * Thứ tự rule trong YAML: rule đầu tiên khớp được áp dụng.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class CatalogRateLimitFilter extends OncePerRequestFilter {

    private static final String HEADER_FORWARDED = "X-Forwarded-For";

    private final RateLimitProperties properties;
    private final StringRedisTemplate rateLimitRedisTemplate;
    private final ObjectMapper objectMapper;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        if (!properties.isEnabled()) {
            return true;
        }
        String uri = request.getRequestURI();
        if (uri.startsWith("/actuator/")
                || uri.startsWith("/product/swagger-ui")
                || uri.startsWith("/product/v3/api-docs")
                || uri.startsWith("/product/webjars")) {
            return true;
        }
        return !uri.startsWith("/api/v1/");
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String method = request.getMethod().toUpperCase(Locale.ROOT);
        String path = request.getRequestURI();

        RateLimitProperties.Rule matched = findMatchingRule(method, path);
        if (matched == null) {
            filterChain.doFilter(request, response);
            return;
        }

        String actorKey = resolveActorKey(request);
        long window = Math.max(1, matched.getWindowSeconds());
        long bucket = Instant.now().getEpochSecond() / window;
        String redisKey = "rl:catalog:" + matched.getName() + ":" + actorKey + ":" + bucket;

        try {
            Long count = rateLimitRedisTemplate.opsForValue().increment(redisKey);
            if (count != null && count == 1L) {
                rateLimitRedisTemplate.expire(redisKey, java.time.Duration.ofSeconds(window));
            }
            int max = Math.max(1, matched.getMaxRequests());
            if (count != null && count > max) {
                writeTooManyRequests(response, matched.getName(), max, (int) window);
                return;
            }
        } catch (Exception e) {
            if (properties.isFailOpenOnRedisError()) {
                log.warn("Rate limit Redis error, fail-open: {}", e.getMessage());
            } else {
                log.error("Rate limit Redis error", e);
                response.setStatus(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.getWriter().write(
                        objectMapper.writeValueAsString(Map.of(
                                "success", false,
                                "message", "Rate limit tạm thời không khả dụng."
                        )));
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private RateLimitProperties.Rule findMatchingRule(String method, String path) {
        List<RateLimitProperties.Rule> rules = properties.getRules();
        if (rules == null || rules.isEmpty()) {
            return null;
        }
        for (RateLimitProperties.Rule rule : rules) {
            if (rule.getPattern() == null || rule.getPattern().isBlank()) {
                continue;
            }
            if (!methodsMatch(rule.getMethods(), method)) {
                continue;
            }
            boolean match = rule.isExactMatch()
                    ? path.equals(rule.getPattern())
                    : pathMatcher.match(rule.getPattern(), path);
            if (match) {
                return rule;
            }
        }
        return null;
    }

    private static boolean methodsMatch(List<String> configured, String requestMethod) {
        if (configured == null || configured.isEmpty()) {
            return true;
        }
        for (String m : configured) {
            if (m != null && m.equalsIgnoreCase(requestMethod)) {
                return true;
            }
        }
        return false;
    }

    private String resolveActorKey(HttpServletRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof JwtUserPrincipal jwt) {
            return "u:" + jwt.getUserId();
        }
        return "ip:" + clientIp(request);
    }

    private static String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader(HEADER_FORWARDED);
        if (forwarded != null && !forwarded.isBlank()) {
            int comma = forwarded.indexOf(',');
            String first = comma > 0 ? forwarded.substring(0, comma) : forwarded;
            return first.trim();
        }
        return request.getRemoteAddr() == null ? "unknown" : request.getRemoteAddr();
    }

    private void writeTooManyRequests(HttpServletResponse response, String ruleName, int max, int windowSec)
            throws IOException {
        response.setStatus(429);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        Map<String, Object> body = new HashMap<>();
        body.put("success", false);
        body.put("message", "Quá nhiều yêu cầu (" + ruleName + "). Giới hạn " + max + " request / "
                + windowSec + " giây. Vui lòng thử lại sau.");
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}
