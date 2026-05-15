package com.beverage.product.application.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {
    private UUID id;
    private UUID categoryId;

    private String name;
    private String slug;
    private String description;
    private String imageUrl;

    private Boolean isAvailable;
    private Boolean isFeatured;
    private Short displayOrder;

    private List<ProductVariantResponse> variants;
    private List<ToppingResponse> toppings;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private LocalDateTime deletedAt;
}
