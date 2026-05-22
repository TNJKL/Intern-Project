package com.beverage.order.application.dto.response;

import com.beverage.order.domain.model.OrderStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@Builder
public class OrderTrackingResponse {
    private String orderCode;
    private OrderStatus status;
    private String userName;
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
