package com.beverage.order.infrastructure.persistence.spec;

import com.beverage.order.domain.model.OrderStatus;
import com.beverage.order.infrastructure.persistence.entity.OrderEntity;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.util.UUID;

public final class OrderSpecifications {

    private OrderSpecifications() {}

    public static Specification<OrderEntity> withUserId(UUID userId) {
        if (userId == null) {
            return Specification.where(null);
        }
        return (root, query, cb) -> cb.equal(root.get("userId"), userId);
    }

    public static Specification<OrderEntity> withStatus(OrderStatus status) {
        if (status == null) {
            return Specification.where(null);
        }
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    public static Specification<OrderEntity> withOrderCode(String orderCode) {
        if (orderCode == null || orderCode.isBlank()) {
            return Specification.where(null);
        }
        return (root, query, cb) -> cb.equal(root.get("orderCode"), orderCode.trim());
    }

    public static Specification<OrderEntity> createdFrom(Instant from) {
        if (from == null) {
            return Specification.where(null);
        }
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), from);
    }

    public static Specification<OrderEntity> createdTo(Instant to) {
        if (to == null) {
            return Specification.where(null);
        }
        return (root, query, cb) -> cb.lessThanOrEqualTo(root.get("createdAt"), to);
    }
}
