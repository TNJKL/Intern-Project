package com.beverage.inventory.infrastructure.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ToppingListCatalogDto {
    private boolean success;
    private List<ToppingCatalogDto.ToppingData> data;
}
