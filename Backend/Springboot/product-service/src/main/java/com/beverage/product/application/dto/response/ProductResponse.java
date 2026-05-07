package com.beverage.product.application.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
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

    private BigDecimal price;
    private Boolean isAvailable;
    private Boolean isFeatured;
    private Short displayOrder;

    private List<ToppingResponse> toppings;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

