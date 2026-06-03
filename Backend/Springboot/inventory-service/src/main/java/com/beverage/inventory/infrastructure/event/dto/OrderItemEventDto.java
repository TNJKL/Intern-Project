package com.beverage.inventory.infrastructure.event.dto;

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
public class OrderItemEventDto {
    private UUID productId;
    private UUID variantId;
    private String variantLabel;
    private String productName;
    private List<ToppingSnapshotDto> toppings;
    private BigDecimal unitPrice;
    private Short quantity;
    private BigDecimal subtotal;
}
