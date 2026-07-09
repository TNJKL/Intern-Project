package com.beverage.payment.infrastructure.persistence.spec;

import com.beverage.payment.domain.model.RefundStatus;
import com.beverage.payment.infrastructure.persistence.entity.RefundEntity;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.util.UUID;

public final class RefundSpecifications {

    private RefundSpecifications() {}

    public static Specification<RefundEntity> withPaymentId(UUID paymentId) {
        if (paymentId == null) {
            return Specification.where(null);
        }
        return (root, query, cb) -> cb.equal(root.get("paymentId"), paymentId);
    }

    public static Specification<RefundEntity> withOrderId(UUID orderId) {
        if (orderId == null) {
            return Specification.where(null);
        }
        return (root, query, cb) -> cb.equal(root.get("orderId"), orderId);
    }

    public static Specification<RefundEntity> withUserId(UUID userId) {
        if (userId == null) {
            return Specification.where(null);
        }
        return (root, query, cb) -> cb.equal(root.get("userId"), userId);
    }

    public static Specification<RefundEntity> withStatus(RefundStatus status) {
        if (status == null) {
            return Specification.where(null);
        }
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    public static Specification<RefundEntity> withRequestedBy(UUID requestedBy) {
        if (requestedBy == null) {
            return Specification.where(null);
        }
        return (root, query, cb) -> cb.equal(root.get("requestedBy"), requestedBy);
    }

    public static Specification<RefundEntity> createdFrom(Instant from) {
        if (from == null) {
            return Specification.where(null);
        }
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), from);
    }

    public static Specification<RefundEntity> createdTo(Instant to) {
        if (to == null) {
            return Specification.where(null);
        }
        return (root, query, cb) -> cb.lessThanOrEqualTo(root.get("createdAt"), to);
    }

    public static Specification<RefundEntity> withOrderCode(String orderCode) {
        if (orderCode == null || orderCode.isBlank()) {
            return Specification.where(null);
        }
        return (root, query, cb) -> cb.like(cb.lower(root.get("orderCode")), "%" + orderCode.trim().toLowerCase() + "%");
    }

    public static Specification<RefundEntity> withRecipientType(String recipientType) {
        if (recipientType == null || recipientType.isBlank()) {
            return Specification.where(null);
        }
        return (root, query, cb) -> cb.equal(root.get("recipientType"), recipientType.trim().toUpperCase());
    }
}
