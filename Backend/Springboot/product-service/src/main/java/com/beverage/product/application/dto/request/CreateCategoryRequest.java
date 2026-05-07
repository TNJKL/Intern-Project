package com.beverage.product.application.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateCategoryRequest {
    @NotBlank
    @Size(max = 100)
    private String name;

    @NotBlank
    @Size(max = 100)
    private String slug;

    // Optional
    private String imageUrl;

    // Optional, default 0
    private Short displayOrder;

    // Optional, default true
    private Boolean isActive;
}

