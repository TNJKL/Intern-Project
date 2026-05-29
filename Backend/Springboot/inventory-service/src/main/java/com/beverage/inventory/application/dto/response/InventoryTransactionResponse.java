package com.beverage.inventory.application.dto.response;

import com.beverage.inventory.domain.model.InventoryTransactionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryTransactionResponse {
    private UUID id;
    private UUID ingredientId;
    private String ingredientName;
    private UUID orderId;
    private InventoryTransactionType transactionType;
    private BigDecimal quantity;
    private BigDecimal quantityBefore;
    private BigDecimal quantityAfter;
    private String note;
    private Instant createdAt;
}
