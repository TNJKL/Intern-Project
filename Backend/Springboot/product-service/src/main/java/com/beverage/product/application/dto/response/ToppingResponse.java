package com.beverage.product.application.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
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

    /** Luôn xuất hiện trong JSON (kể cả null) — override cấu hình global non_null. */
    @JsonInclude(JsonInclude.Include.ALWAYS)
    private String imageUrl;
    private BigDecimal price;
    private Boolean isAvailable;
    private Short displayOrder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private LocalDateTime deletedAt;
}

