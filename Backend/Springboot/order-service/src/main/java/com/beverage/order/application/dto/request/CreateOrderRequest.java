package com.beverage.order.application.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class CreateOrderRequest {

    @Size(max = 20)
    private String userPhone;

    private String deliveryAddress;
    private String paymentMethod;

    @Size(max = 1000)
    private String note;

    @NotEmpty
    @Valid
    private List<OrderLineRequest> items = new ArrayList<>();
}
