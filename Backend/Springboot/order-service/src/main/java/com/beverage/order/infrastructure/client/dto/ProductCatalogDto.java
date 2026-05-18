package com.beverage.order.infrastructure.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ProductCatalogDto {
    private boolean success;
    private ProductData data;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ProductData {
        private UUID id;
        private String name;
        private Boolean isAvailable;
        private List<VariantData> variants;
        private List<ToppingData> toppings;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class VariantData {
        private UUID id;
        private String sizeLabel;
        private BigDecimal price;
        private Boolean isAvailable;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ToppingData {
        private UUID id;
        private String name;
        private BigDecimal price;
        private Boolean isAvailable;
    }
}
