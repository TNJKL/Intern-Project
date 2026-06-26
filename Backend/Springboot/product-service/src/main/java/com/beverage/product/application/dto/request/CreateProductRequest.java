package com.beverage.product.application.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class CreateProductRequest {

    @NotNull
    private UUID categoryId;

    @NotBlank
    @Size(max = 255)
    private String name;

    /** Để trống: backend tự sinh slug từ {@link #name}. */
    @Size(max = 255)
    private String slug;

    private String description;

    private String imageUrl;

    private List<String> additionalImageUrls;

    private Boolean isAvailable;

    private Boolean isFeatured;

    private Short displayOrder;

    // Cho MVP: chỉ lưu danh sách topping_id qua product_toppings.
    @Size(max = 200)
    private List<UUID> toppingIds;

    /**
     * Tùy chọn: tạo kèm các variant (size + giá) trong cùng transaction với sản phẩm.
     */
    @Valid
    private List<InitialVariantRequest> initialVariants;
}
