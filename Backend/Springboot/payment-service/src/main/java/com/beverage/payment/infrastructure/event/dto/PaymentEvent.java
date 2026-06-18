package com.beverage.payment.infrastructure.event.dto;

import java.util.UUID;

public interface PaymentEvent {
    UUID getEventId();
    void setEventId(UUID eventId);
    UUID getOrderId();
}
