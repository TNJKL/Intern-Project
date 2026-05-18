package com.beverage.product.application.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class ReorderItemRequest {

    @NotNull(message = "id không được để trống")
    private UUID id;

    @NotNull(message = "displayOrder không được để trống")
    @Min(value = 0, message = "displayOrder phải >= 0")
    private Integer displayOrder;
}
