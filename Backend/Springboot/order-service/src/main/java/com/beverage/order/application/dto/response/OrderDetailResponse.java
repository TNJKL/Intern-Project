package com.beverage.order.application.dto.response;

import com.beverage.order.domain.model.OrderStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class OrderDetailResponse {
    private UUID id;
    private String orderCode;
    private UUID userId;
    private String userEmail;
    private String userName;
    private String userPhone;
    private OrderStatus status;
    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal totalAmount;
    private UUID voucherId;
    private String voucherCode;
    private String deliveryAddress;
    private String paymentMethod;
    private String note;
    private Instant createdAt;
    private Instant updatedAt;
    private List<OrderItemResponse> items;
    private List<OrderStatusHistoryResponse> statusHistory;
}
