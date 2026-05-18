package com.beverage.order.application.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
public class OrderLineRequest {

    @NotNull
    private UUID productId;

    @NotNull
    private UUID variantId;

    @NotNull
    @Min(1)
    private Short quantity;

    private List<UUID> toppingIds = new ArrayList<>();
}
