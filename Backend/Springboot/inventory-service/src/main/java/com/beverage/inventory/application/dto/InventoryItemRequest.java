package com.beverage.inventory.application.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryItemRequest {

    @NotNull(message = "productId không được để trống")
    private UUID productId;

    private UUID variantId; // Nullable — null nghĩa là sản phẩm không có biến thể size

    @NotNull(message = "quantity không được để trống")
    @Min(value = 1, message = "quantity phải lớn hơn 0")
    private Integer quantity;

    private List<UUID> toppingIds; // Nullable — không có topping thì bỏ qua
}
