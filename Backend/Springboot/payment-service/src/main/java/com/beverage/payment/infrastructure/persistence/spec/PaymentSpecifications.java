package com.beverage.payment.infrastructure.persistence.spec;

import com.beverage.payment.domain.model.PaymentMethod;
import com.beverage.payment.domain.model.PaymentStatus;
import com.beverage.payment.infrastructure.persistence.entity.PaymentEntity;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.util.UUID;

public final class PaymentSpecifications {

    private PaymentSpecifications() {}

    public static Specification<PaymentEntity> withOrderId(UUID orderId) {
        if (orderId == null) {
            return Specification.where(null);
        }
        return (root, query, cb) -> cb.equal(root.get("orderId"), orderId);
    }

    public static Specification<PaymentEntity> withOrderCode(String orderCode) {
        if (orderCode == null || orderCode.isBlank()) {
            return Specification.where(null);
        }
        return (root, query, cb) -> cb.like(cb.lower(root.get("orderCode")), "%" + orderCode.trim().toLowerCase() + "%");
    }

    public static Specification<PaymentEntity> withUserId(UUID userId) {
        if (userId == null) {
            return Specification.where(null);
        }
        return (root, query, cb) -> cb.equal(root.get("userId"), userId);
    }

    public static Specification<PaymentEntity> withStatus(PaymentStatus status) {
        if (status == null) {
            return Specification.where(null);
        }
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    public static Specification<PaymentEntity> withPaymentMethod(PaymentMethod paymentMethod) {
        if (paymentMethod == null) {
            return Specification.where(null);
        }
        return (root, query, cb) -> cb.equal(root.get("paymentMethod"), paymentMethod);
    }

    public static Specification<PaymentEntity> createdFrom(Instant from) {
        if (from == null) {
            return Specification.where(null);
        }
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), from);
    }

    public static Specification<PaymentEntity> createdTo(Instant to) {
        if (to == null) {
            return Specification.where(null);
        }
        return (root, query, cb) -> cb.lessThanOrEqualTo(root.get("createdAt"), to);
    }
}
