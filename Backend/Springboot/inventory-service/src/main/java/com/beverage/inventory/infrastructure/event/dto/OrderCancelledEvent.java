package com.beverage.inventory.infrastructure.event.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class OrderCancelledEvent extends OrderEventWrapper {

    public static final String EVENT_TYPE = "ORDER_CANCELLED";

    private String eventType = EVENT_TYPE;
    private UUID orderId;
    private String orderCode;
    private UUID userId;
    private String userEmail;
    private String userName;
    private String reason;

    @Override
    public String getEventType() {
        return EVENT_TYPE;
    }
}
