package com.beverage.order.domain.model;

public enum OrderStatus {
    PENDING,
    CONFIRMED,
    PREPARING,
    DELIVERING,
    COMPLETED,
    CANCELLED,
    BOOMED;

    public boolean canTransitionTo(OrderStatus target) {
        return switch (this) {
            case PENDING    -> target == CONFIRMED || target == CANCELLED;
            case CONFIRMED  -> target == PREPARING || target == CANCELLED;
            case PREPARING  -> target == DELIVERING;
            case DELIVERING -> target == COMPLETED || target == BOOMED;
            case COMPLETED, CANCELLED, BOOMED -> false;
        };
    }

    public boolean isTerminal() {
        return this == COMPLETED || this == CANCELLED || this == BOOMED;
    }
}
