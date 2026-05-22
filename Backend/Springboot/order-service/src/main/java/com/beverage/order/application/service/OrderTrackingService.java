package com.beverage.order.application.service;

import com.beverage.order.application.dto.response.OrderTrackingResponse;
import com.beverage.order.application.mapper.OrderDtoMapper;
import com.beverage.order.domain.exception.ResourceNotFoundException;
import com.beverage.order.domain.exception.TooManyRequestsException;
import com.beverage.order.infrastructure.persistence.entity.OrderEntity;
import com.beverage.order.infrastructure.persistence.entity.OrderStatusHistoryEntity;
import com.beverage.order.infrastructure.persistence.repository.OrderJpaRepository;
import com.beverage.order.infrastructure.persistence.repository.OrderStatusHistoryJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderTrackingService {

    private static final String RATE_LIMIT_KEY_PREFIX = "order-track-rate:";
    private static final int MAX_REQUESTS_PER_MINUTE = 5;
    private static final Duration RATE_LIMIT_WINDOW = Duration.ofMinutes(1);

    private final OrderJpaRepository orderJpaRepository;
    private final OrderStatusHistoryJpaRepository statusHistoryJpaRepository;
    private final OrderDtoMapper orderDtoMapper;
    private final RedisTemplate<String, Object> redisTemplate;

    @Transactional(readOnly = true)
    public OrderTrackingResponse trackOrder(String orderCode, String phone, String clientIp) {
        checkRateLimit(clientIp);

        OrderEntity order = orderJpaRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng", "orderCode", orderCode));

        if (!phone.equals(order.getUserPhone())) {
            throw new ResourceNotFoundException("Đơn hàng", "orderCode", orderCode);
        }

        List<OrderStatusHistoryEntity> history =
                statusHistoryJpaRepository.findByOrderIdOrderByCreatedAtAsc(order.getId());

        return orderDtoMapper.toTracking(order, history);
    }

    private void checkRateLimit(String clientIp) {
        String key = RATE_LIMIT_KEY_PREFIX + clientIp;

        try {
            Long currentCount = redisTemplate.opsForValue().increment(key);

            if (currentCount != null && currentCount == 1) {
                redisTemplate.expire(key, RATE_LIMIT_WINDOW);
            }

            if (currentCount != null && currentCount > MAX_REQUESTS_PER_MINUTE) {
                log.warn("Rate limit exceeded for IP: {}", clientIp);
                throw new TooManyRequestsException("Quá nhiều yêu cầu tra cứu. Vui lòng thử lại sau.");
            }
        } catch (TooManyRequestsException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Rate limit check failed: {}", e.getMessage());
        }
    }
}
