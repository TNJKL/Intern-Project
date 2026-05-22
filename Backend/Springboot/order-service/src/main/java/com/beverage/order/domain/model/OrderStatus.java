package com.beverage.order.domain.model;

public enum OrderStatus {
    PENDING,
    CONFIRMED,
    PREPARING,
    DELIVERING,
    COMPLETED,
    CANCELLED;

    public boolean canTransitionTo(OrderStatus target) {
        return switch (this) {
            case PENDING    -> target == CONFIRMED || target == CANCELLED;
            case CONFIRMED  -> target == PREPARING || target == CANCELLED;
            case PREPARING  -> target == DELIVERING;
            case DELIVERING -> target == COMPLETED;
            case COMPLETED, CANCELLED -> false;
        };
    }

    public boolean isTerminal() {
        return this == COMPLETED || this == CANCELLED;
    }
}
