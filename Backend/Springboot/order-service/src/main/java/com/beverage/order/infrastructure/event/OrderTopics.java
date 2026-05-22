package com.beverage.order.infrastructure.event;

/** Noi duy nhat khai bao ten Kafka topic cho Order Service. */
public final class OrderTopics {

    private OrderTopics() {}

    public static final String ORDER_EVENTS = "order-events";
    public static final String ORDER_TIMEOUT_EVENTS = "order-timeout-events";
}
