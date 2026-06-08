package com.beverage.inventory.infrastructure.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ToppingCatalogDto {
    private boolean success;
    private ToppingData data;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ToppingData {
        private UUID id;
        private String name;
        private BigDecimal price;
        private Boolean isAvailable;
    }
}
