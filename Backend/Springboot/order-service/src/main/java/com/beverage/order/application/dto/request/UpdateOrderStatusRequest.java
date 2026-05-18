package com.beverage.order.application.dto.request;

import com.beverage.order.domain.model.OrderStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateOrderStatusRequest {

    @NotNull
    private OrderStatus status;

    @Size(max = 500)
    private String note;
}
