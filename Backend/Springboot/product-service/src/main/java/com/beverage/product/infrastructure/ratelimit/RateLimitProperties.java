package com.beverage.product.infrastructure.ratelimit;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

@Data
@ConfigurationProperties(prefix = "app.rate-limit")
public class RateLimitProperties {

    /** Tắt toàn bộ rate limit (vd. test local không Redis). */
    private boolean enabled = true;

    /**
     * Nếu true: Redis lỗi / timeout → vẫn cho request qua (ưu tiên availability).
     * Nếu false: lỗi Redis → 503 (chặt hơn, khó debug dev).
     */
    private boolean failOpenOnRedisError = true;

    private List<Rule> rules = new ArrayList<>();

    @Data
    public static class Rule {
        /** Tên rule — dùng làm phần key Redis. */
        private String name;
        /** Ant pattern, ví dụ {@code /api/v1/products/suggest} hoặc {@code /api/v1/products/**}. */
        private String pattern;
        /** Nếu true: chỉ khớp path chính xác (không dùng ant *). */
        private boolean exactMatch;
        /** HTTP methods, chữ HOA, ví dụ GET, PATCH. Rỗng = mọi method. */
        private List<String> methods = new ArrayList<>();
        private int maxRequests = 60;
        private int windowSeconds = 60;
    }
}
