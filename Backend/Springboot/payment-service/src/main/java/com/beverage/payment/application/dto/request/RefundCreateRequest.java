package com.beverage.payment.application.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class RefundCreateRequest {
    @NotNull(message = "Amount must not be null")
    @DecimalMin(value = "1", message = "Amount must be greater than 0")
    private BigDecimal amount;

    @NotBlank(message = "Reason must not be blank")
    private String reason;
}
