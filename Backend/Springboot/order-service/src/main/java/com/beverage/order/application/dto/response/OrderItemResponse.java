package com.beverage.order.application.dto.response;

import com.beverage.order.domain.model.ToppingSnapshot;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemResponse {
    private UUID id;
    private UUID productId;
    private UUID variantId;
    private String variantLabel;
    private String productName;
    private List<ToppingSnapshot> toppings;
    private BigDecimal unitPrice;
    private Short quantity;
    private BigDecimal subtotal;
}
