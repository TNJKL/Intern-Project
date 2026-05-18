package com.beverage.order.application.service;

import com.beverage.order.application.dto.request.OrderLineRequest;
import com.beverage.order.domain.exception.BusinessException;
import com.beverage.order.domain.model.ToppingSnapshot;
import com.beverage.order.infrastructure.client.ProductServiceClient;
import com.beverage.order.infrastructure.client.dto.ProductCatalogDto;
import com.beverage.order.infrastructure.persistence.entity.OrderItemEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderPricingService {

    private final ProductServiceClient productServiceClient;

    public OrderItemEntity buildLineItem(OrderLineRequest line) {
        ProductCatalogDto.ProductData product = productServiceClient.getProduct(line.getProductId());

        if (!Boolean.TRUE.equals(product.getIsAvailable())) {
            throw new BusinessException("Sản phẩm không còn bán: " + product.getName(), "PRODUCT_UNAVAILABLE");
        }

        ProductCatalogDto.VariantData variant = findVariant(product, line.getVariantId());
        if (!Boolean.TRUE.equals(variant.getIsAvailable())) {
            throw new BusinessException("Phiên bản sản phẩm không khả dụng: " + product.getName(), "VARIANT_UNAVAILABLE");
        }

        List<ToppingSnapshot> toppingSnapshots = resolveToppings(product, line.getToppingIds());
        BigDecimal toppingsTotal = toppingSnapshots.stream()
                .map(ToppingSnapshot::getUnitPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal unitPrice = variant.getPrice().add(toppingsTotal);
        BigDecimal lineSubtotal = unitPrice.multiply(BigDecimal.valueOf(line.getQuantity()));

        return OrderItemEntity.builder()
                .productId(product.getId())
                .variantId(variant.getId())
                .variantLabel(variant.getSizeLabel())
                .productName(product.getName())
                .toppings(toppingSnapshots)
                .unitPrice(unitPrice)
                .quantity(line.getQuantity())
                .subtotal(lineSubtotal)
                .build();
    }

    private ProductCatalogDto.VariantData findVariant(ProductCatalogDto.ProductData product, UUID variantId) {
        if (product.getVariants() == null) {
            throw new BusinessException("Sản phẩm không có phiên bản giá", "VARIANT_NOT_FOUND");
        }
        return product.getVariants().stream()
                .filter(v -> variantId.equals(v.getId()))
                .findFirst()
                .orElseThrow(() -> new BusinessException(
                        "Variant không thuộc sản phẩm " + product.getName(),
                        "VARIANT_NOT_FOUND"
                ));
    }

    private List<ToppingSnapshot> resolveToppings(
            ProductCatalogDto.ProductData product,
            List<UUID> toppingIds
    ) {
        if (toppingIds == null || toppingIds.isEmpty()) {
            return List.of();
        }

        Set<UUID> uniqueIds = new LinkedHashSet<>(toppingIds);
        if (uniqueIds.size() != toppingIds.size()) {
            throw new BusinessException("Danh sách topping trùng lặp", "DUPLICATE_TOPPING");
        }

        Map<UUID, ProductCatalogDto.ToppingData> toppingMap = Optional.ofNullable(product.getToppings())
                .orElse(List.of())
                .stream()
                .collect(Collectors.toMap(ProductCatalogDto.ToppingData::getId, t -> t, (a, b) -> a));

        List<ToppingSnapshot> snapshots = new ArrayList<>();
        for (UUID toppingId : uniqueIds) {
            ProductCatalogDto.ToppingData topping = toppingMap.get(toppingId);
            if (topping == null) {
                throw new BusinessException("Topping không hợp lệ cho sản phẩm " + product.getName(), "TOPPING_NOT_FOUND");
            }
            if (!Boolean.TRUE.equals(topping.getIsAvailable())) {
                throw new BusinessException("Topping không khả dụng: " + topping.getName(), "TOPPING_UNAVAILABLE");
            }
            snapshots.add(ToppingSnapshot.builder()
                    .toppingId(topping.getId())
                    .name(topping.getName())
                    .unitPrice(topping.getPrice())
                    .build());
        }
        return snapshots;
    }
}
