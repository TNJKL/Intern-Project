package com.beverage.product.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "product_variants")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductVariantEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(name = "size_label", length = 50)
    private String sizeLabel;

    @Column(nullable = false, precision = 12, scale = 0)
    private BigDecimal price;

    @Column(name = "is_available", nullable = false)
    @Builder.Default
    private Boolean isAvailable = true;

    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private Short displayOrder = 0;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}
