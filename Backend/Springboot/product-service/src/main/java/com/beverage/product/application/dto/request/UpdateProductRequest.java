package com.beverage.product.application.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
public class UpdateProductRequest {

    @NotNull
    private UUID categoryId;

    @NotBlank
    @Size(max = 255)
    private String name;

    @NotBlank
    @Size(max = 255)
    private String slug;

    private String description;

    private String imageUrl;

    @NotNull
    @DecimalMin(value = "0", inclusive = true)
    private BigDecimal price;

    private Boolean isAvailable;

    private Boolean isFeatured;

    private Short displayOrder;

    @Size(max = 200)
    private List<UUID> toppingIds;
}

