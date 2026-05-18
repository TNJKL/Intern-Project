package com.beverage.product.application.dto.response;

import lombok.Builder;
import lombok.Value;

import java.util.UUID;

/**
 * Payload gọn cho suggest / autocomplete — chỉ chứa đủ thông tin để FE hiển thị dropdown.
 * Không chứa variants, toppings, description để giảm băng thông.
 */
@Value
@Builder
public class ProductSuggestResponse {
    UUID id;
    String name;
    String slug;
    String imageUrl;
    UUID categoryId;
}
