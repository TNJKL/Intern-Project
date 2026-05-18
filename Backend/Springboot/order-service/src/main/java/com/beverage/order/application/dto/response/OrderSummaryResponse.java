package com.beverage.order.application.dto.response;

import com.beverage.order.domain.model.OrderStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class OrderSummaryResponse {
    private UUID id;
    private String orderCode;
    private OrderStatus status;
    private BigDecimal totalAmount;
    private Instant createdAt;
}
