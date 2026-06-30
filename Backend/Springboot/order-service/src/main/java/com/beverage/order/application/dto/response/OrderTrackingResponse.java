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
public class OrderTrackingResponse {
    private UUID id;
    private String guestSessionId;
    private String orderCode;
    private OrderStatus status;
    private String cancellationReason;
    private String userName;
    private String userEmail;
    private String userPhone;
    private String deliveryAddress;
    private String paymentMethod;
    private String voucherMessage;
    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal totalAmount;
    private String note;
    private Instant createdAt;
    private List<OrderItemResponse> items;
    private List<OrderStatusHistoryResponse> statusHistory;
}
