package com.beverage.order.application.dto.response;

import com.beverage.order.domain.model.OrderStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class OrderStatusHistoryResponse {
    private UUID id;
    private OrderStatus status;
    private String note;
    private Instant createdAt;
}
