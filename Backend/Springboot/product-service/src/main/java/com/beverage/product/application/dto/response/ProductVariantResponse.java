package com.beverage.product.application.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductVariantResponse {

    private UUID id;

    @JsonInclude(JsonInclude.Include.ALWAYS)
    private String sizeLabel;

    private BigDecimal price;
    private Boolean isAvailable;
    private Short displayOrder;
}
