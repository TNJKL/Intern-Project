package com.beverage.order.infrastructure.cache;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Quản lý guest session cho realtime WebSocket.
 * Guest (không đăng nhập) được cấp một guestSessionId tạm thời sau khi tạo đơn hàng.
 * Notification Service dùng key này để xác thực và join room "order:{orderCode}".
 *
 * Redis key format: guest:session:{guestSessionId}  →  VALUE = orderCode
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GuestSessionCacheService {

    private static final String KEY_PREFIX = "guest:session:";

    private final RedisTemplate<String, Object> redisTemplate;

    @Value("${app.guest-session.ttl-hours:24}")
    private long ttlHours;

    /**
     * Tạo mới một guestSessionId và lưu vào Redis.
     * @param orderCode mã đơn hàng của guest
     * @return guestSessionId duy nhất để trả về cho FE
     */
    public String create(String orderCode) {
        // Dùng UUID v4 — đủ ngẫu nhiên, không thể brute-force
        String guestSessionId = UUID.randomUUID().toString();
        String key = KEY_PREFIX + guestSessionId;
        redisTemplate.opsForValue().set(key, orderCode, ttlHours, TimeUnit.HOURS);
        log.debug("Created guest session {} for order {}", guestSessionId, orderCode);
        return guestSessionId;
    }

    /**
     * Lấy orderCode từ guestSessionId.
     * @return orderCode nếu session hợp lệ và chưa hết hạn, null nếu không tồn tại
     */
    public String getOrderCode(String guestSessionId) {
        Object value = redisTemplate.opsForValue().get(KEY_PREFIX + guestSessionId);
        if (value instanceof String orderCode) {
            return orderCode;
        }
        return null;
    }

    /**
     * Revoke (thu hồi) guest session — dùng khi đơn hàng hoàn thành hoặc bị hủy.
     */
    public void revoke(String guestSessionId) {
        redisTemplate.delete(KEY_PREFIX + guestSessionId);
        log.debug("Revoked guest session {}", guestSessionId);
    }
}
