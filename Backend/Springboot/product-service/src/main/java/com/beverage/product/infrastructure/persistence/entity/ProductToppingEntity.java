package com.beverage.product.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(
        name = "product_toppings",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_product_toppings_product_topping",
                        columnNames = {"product_id", "topping_id"}
                )
        },
        indexes = {
                @Index(name = "idx_product_toppings_product", columnList = "product_id"),
                @Index(name = "idx_product_toppings_topping", columnList = "topping_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductToppingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(name = "topping_id", nullable = false)
    private UUID toppingId;
}

