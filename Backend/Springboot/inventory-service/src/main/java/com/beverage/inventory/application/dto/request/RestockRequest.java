package com.beverage.inventory.application.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RestockRequest {

    @NotNull(message = "Số lượng nhập kho không được để trống")
    @DecimalMin(value = "0.001", message = "Số lượng nhập kho phải lớn hơn 0")
    private BigDecimal quantity;

    private String note;
}
