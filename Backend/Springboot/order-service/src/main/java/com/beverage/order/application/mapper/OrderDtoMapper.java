package com.beverage.order.application.mapper;

import com.beverage.order.application.dto.response.OrderDetailResponse;
import com.beverage.order.application.dto.response.OrderItemResponse;
import com.beverage.order.application.dto.response.OrderStatusHistoryResponse;
import com.beverage.order.application.dto.response.OrderSummaryResponse;
import com.beverage.order.application.dto.response.OrderTrackingResponse;
import com.beverage.order.infrastructure.persistence.entity.OrderEntity;
import com.beverage.order.infrastructure.persistence.entity.OrderItemEntity;
import com.beverage.order.infrastructure.persistence.entity.OrderStatusHistoryEntity;
import com.beverage.order.infrastructure.persistence.entity.VoucherEntity;
import com.beverage.order.infrastructure.persistence.repository.VoucherJpaRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class OrderDtoMapper {

    private final VoucherJpaRepository voucherRepository;

    public OrderDtoMapper(VoucherJpaRepository voucherRepository) {
        this.voucherRepository = voucherRepository;
    }

    public OrderSummaryResponse toSummary(OrderEntity entity) {
        return OrderSummaryResponse.builder()
                .id(entity.getId())
                .orderCode(entity.getOrderCode())
                .status(entity.getStatus())
                .totalAmount(entity.getTotalAmount())
                .paymentMethod(entity.getPaymentMethod())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    public OrderDetailResponse toDetail(
            OrderEntity entity,
            List<OrderStatusHistoryEntity> history
    ) {
        String[] voucherCode = {null};
        if (entity.getVoucherId() != null) {
            voucherRepository.findById(entity.getVoucherId())
                    .ifPresent(v -> voucherCode[0] = v.getCode());
        }

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
                .voucherId(entity.getVoucherId())
                .voucherCode(voucherCode[0])
                .deliveryAddress(entity.getDeliveryAddress())
                .paymentMethod(entity.getPaymentMethod())
                .note(entity.getNote())
                .cancellationReason(entity.getCancellationReason())
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

    public OrderTrackingResponse toTracking(
            OrderEntity entity,
            List<OrderStatusHistoryEntity> history,
            String guestSessionId
    ) {
        String maskedPhone = maskPhone(entity.getUserPhone());

        String voucherMessage = entity.getVoucherId() != null
                ? voucherRepository.findById(entity.getVoucherId())
                        .map(v -> "Đã áp dụng Voucher: " + v.getCode())
                        .orElse(null)
                : null;

        return OrderTrackingResponse.builder()
                .id(entity.getId())
                .guestSessionId(guestSessionId)
                .orderCode(entity.getOrderCode())
                .status(entity.getStatus())
                .cancellationReason(entity.getCancellationReason())
                .userName(entity.getUserName())
                .userEmail(entity.getUserEmail())
                .userPhone(maskedPhone)
                .deliveryAddress(entity.getDeliveryAddress())
                .paymentMethod(entity.getPaymentMethod())
                .voucherMessage(voucherMessage)
                .subtotal(entity.getSubtotal())
                .discountAmount(entity.getDiscountAmount())
                .totalAmount(entity.getTotalAmount())
                .note(entity.getNote())
                .createdAt(entity.getCreatedAt())
                .items(entity.getItems().stream().map(this::toItem).toList())
                .statusHistory(history.stream().map(this::toHistory).toList())
                .build();
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 7) {
            return phone;
        }
        int len = phone.length();
        return phone.substring(0, 3) + "****" + phone.substring(len - 4);
    }
}
