package com.beverage.order.application.event.payment;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        include = JsonTypeInfo.As.EXISTING_PROPERTY,
        property = "eventType",
        visible = true
)
@JsonSubTypes({
        @JsonSubTypes.Type(value = PaymentCompletedEvent.class, name = "PAYMENT_COMPLETED"),
        @JsonSubTypes.Type(value = PaymentExpiredEvent.class, name = "PAYMENT_EXPIRED"),
        @JsonSubTypes.Type(value = PaymentFailedEvent.class, name = "PAYMENT_FAILED"),
        @JsonSubTypes.Type(value = PaymentUrlCreatedEvent.class, name = "PAYMENT_URL_CREATED")
})
@NoArgsConstructor
@Getter
@Setter
public abstract class PaymentEventWrapper {
    public abstract String getEventType();
    public abstract UUID getOrderId();

    @JsonProperty("eventId")
    private UUID eventId;

    @JsonProperty("occurredAt")
    private Instant occurredAt;
}
