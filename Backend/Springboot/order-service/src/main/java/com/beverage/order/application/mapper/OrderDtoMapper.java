package com.beverage.order.application.mapper;

import com.beverage.order.application.dto.response.OrderDetailResponse;
import com.beverage.order.application.dto.response.OrderItemResponse;
import com.beverage.order.application.dto.response.OrderStatusHistoryResponse;
import com.beverage.order.application.dto.response.OrderSummaryResponse;
import com.beverage.order.infrastructure.persistence.entity.OrderEntity;
import com.beverage.order.infrastructure.persistence.entity.OrderItemEntity;
import com.beverage.order.infrastructure.persistence.entity.OrderStatusHistoryEntity;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class OrderDtoMapper {

    public OrderSummaryResponse toSummary(OrderEntity entity) {
        return OrderSummaryResponse.builder()
                .id(entity.getId())
                .orderCode(entity.getOrderCode())
                .status(entity.getStatus())
                .totalAmount(entity.getTotalAmount())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    public OrderDetailResponse toDetail(
            OrderEntity entity,
            List<OrderStatusHistoryEntity> history
    ) {
        return OrderDetailResponse.builder()
                .id(entity.getId())
                .orderCode(entity.getOrderCode())
                .userId(entity.getUserId())
                .userEmail(entity.getUserEmail())
                .userName(entity.getUserName())
                .userPhone(entity.getUserPhone())
                .status(entity.getStatus())
                .subtotal(entity.getSubtotal())
                .discountAmount(entity.getDiscountAmount())
                .totalAmount(entity.getTotalAmount())
                .deliveryAddress(entity.getDeliveryAddress())
                .paymentMethod(entity.getPaymentMethod())
                .note(entity.getNote())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .items(entity.getItems().stream().map(this::toItem).toList())
                .statusHistory(history.stream().map(this::toHistory).toList())
                .build();
    }

    public OrderItemResponse toItem(OrderItemEntity item) {
        return OrderItemResponse.builder()
                .id(item.getId())
                .productId(item.getProductId())
                .variantId(item.getVariantId())
                .variantLabel(item.getVariantLabel())
                .productName(item.getProductName())
                .toppings(item.getToppings())
                .unitPrice(item.getUnitPrice())
                .quantity(item.getQuantity())
                .subtotal(item.getSubtotal())
                .build();
    }

    private OrderStatusHistoryResponse toHistory(OrderStatusHistoryEntity entity) {
        return OrderStatusHistoryResponse.builder()
                .id(entity.getId())
                .status(entity.getStatus())
                .note(entity.getNote())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
