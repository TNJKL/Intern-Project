package com.beverage.payment.infrastructure.event.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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
        @JsonSubTypes.Type(value = OrderEventWrapper.StatusChangedStub.class, name = "ORDER_STATUS_CHANGED"),
        @JsonSubTypes.Type(value = OrderEventWrapper.CompletedStub.class, name = "ORDER_COMPLETED")
})
@NoArgsConstructor
@Getter
@Setter
public abstract class OrderEventWrapper {

    public abstract String getEventType();

    @JsonProperty("occurredAt")
    private Instant occurredAt;

    @NoArgsConstructor
    @Getter
    @Setter
    public static class StatusChangedStub extends OrderEventWrapper {
        @Override
        public String getEventType() {
            return "ORDER_STATUS_CHANGED";
        }
    }

    @NoArgsConstructor
    @Getter
    @Setter
    public static class CompletedStub extends OrderEventWrapper {
        @Override
        public String getEventType() {
            return "ORDER_COMPLETED";
        }
    }
}
