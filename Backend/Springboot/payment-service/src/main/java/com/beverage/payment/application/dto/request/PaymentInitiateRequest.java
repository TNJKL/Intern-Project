package com.beverage.payment.application.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class PaymentInitiateRequest {
    @NotNull(message = "OrderId must not be null")
    private UUID orderId;

    @NotBlank(message = "OrderCode must not be blank")
    private String orderCode;

    // @NotNull(message = "UserId must not be null")
    private UUID userId;

    @NotNull(message = "Amount must not be null")
    @DecimalMin(value = "1", message = "Amount must be greater than 0")
    private BigDecimal amount;

    @NotBlank(message = "Payment method must not be blank")
    private String paymentMethod;

    private String ipAddress;
}
