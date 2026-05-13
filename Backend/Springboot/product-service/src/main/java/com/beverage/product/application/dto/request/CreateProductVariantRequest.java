package com.beverage.product.application.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateProductVariantRequest {

    @Size(max = 50)
    private String sizeLabel;

    @NotNull
    @DecimalMin(value = "0", inclusive = true)
    private BigDecimal price;

    private Boolean isAvailable;

    private Short displayOrder;
}
