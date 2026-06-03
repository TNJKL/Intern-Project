package com.beverage.inventory.infrastructure.event.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class OrderTimeoutEvent extends OrderEventWrapper {

    public static final String EVENT_TYPE = "ORDER_TIMEOUT";

    private String eventType = EVENT_TYPE;
    private UUID orderId;
    private String orderCode;
    private UUID userId;
    private String userEmail;
    private String userName;
    private Instant paymentDeadline;
    private Instant expiredAt;

    @Override
    public String getEventType() {
        return EVENT_TYPE;
    }
}
