package com.beverage.payment.domain.model;

public enum PaymentStatus {
    PENDING,
    PROCESSING,
    SUCCESS,
    FAILED,
    EXPIRED,
    REFUNDED,
    PAID_BY_SHIPPER
}
