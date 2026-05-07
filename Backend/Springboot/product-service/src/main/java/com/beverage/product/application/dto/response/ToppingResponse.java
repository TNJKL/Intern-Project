package com.beverage.product.application.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ToppingResponse {
    private UUID id;
    private String name;
    private BigDecimal price;
    private Boolean isAvailable;
    private Short displayOrder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

