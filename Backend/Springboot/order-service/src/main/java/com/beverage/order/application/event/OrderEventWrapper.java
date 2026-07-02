package com.beverage.order.application.event;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.NoArgsConstructor;

import java.time.Instant;

@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        include = JsonTypeInfo.As.EXISTING_PROPERTY,
        property = "eventType",
        visible = true
)
@JsonSubTypes({
        @JsonSubTypes.Type(value = OrderCreatedEvent.class, name = "ORDER_CREATED"),
        @JsonSubTypes.Type(value = OrderCancelledEvent.class, name = "ORDER_CANCELLED"),
        @JsonSubTypes.Type(value = OrderStatusChangedEvent.class, name = "ORDER_STATUS_CHANGED"),
        @JsonSubTypes.Type(value = OrderCompletedEvent.class, name = "ORDER_COMPLETED"),
        @JsonSubTypes.Type(value = OrderTimeoutEvent.class, name = "ORDER_TIMEOUT"),
        @JsonSubTypes.Type(value = UserTierUpgradedEvent.class, name = "TIER_UPGRADED")
})
@NoArgsConstructor
public abstract class OrderEventWrapper {

    public abstract String getEventType();

    @JsonProperty("occurredAt")
    public Instant occurredAt;

    public void setOccurredAt(Instant occurredAt) {
        this.occurredAt = occurredAt;
    }
}
