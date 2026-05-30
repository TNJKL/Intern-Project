package com.beverage.inventory.application.usecase;

import com.beverage.inventory.application.dto.InventoryItemRequest;
import com.beverage.inventory.domain.exception.BusinessException;
import com.beverage.inventory.domain.model.InventoryTransactionType;
import com.beverage.inventory.infrastructure.persistence.entity.IngredientEntity;
import com.beverage.inventory.infrastructure.persistence.entity.InventoryTransactionEntity;
import com.beverage.inventory.infrastructure.persistence.entity.RecipeEntity;
import com.beverage.inventory.infrastructure.persistence.entity.RecipeIngredientEntity;
import com.beverage.inventory.infrastructure.persistence.repository.IngredientJpaRepository;
import com.beverage.inventory.infrastructure.persistence.repository.InventoryTransactionJpaRepository;
import com.beverage.inventory.infrastructure.persistence.repository.RecipeIngredientJpaRepository;
import com.beverage.inventory.infrastructure.persistence.repository.RecipeJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryUseCase {

    private final IngredientJpaRepository ingredientJpaRepository;
    private final RecipeJpaRepository recipeJpaRepository;
    private final RecipeIngredientJpaRepository recipeIngredientJpaRepository;
    private final InventoryTransactionJpaRepository inventoryTransactionJpaRepository;

    private Map<UUID, BigDecimal> calculateRequiredIngredients(List<InventoryItemRequest> items) {
        Map<UUID, BigDecimal> requiredIngredients = new HashMap<>();

        for (InventoryItemRequest item : items) {
            if (item.getQuantity() == null || item.getQuantity() <= 0) {
                continue;
            }

            // Find Recipe for Product + Variant
            RecipeEntity recipe = recipeJpaRepository
                    .findByProductIdAndVariantId(item.getProductId(), item.getVariantId())
                    .or(() -> recipeJpaRepository.findByProductIdAndVariantIdIsNull(item.getProductId()))
                    .orElseThrow(() -> new BusinessException("Không tìm thấy công thức cho sản phẩm: " + item.getProductId()));

            // Find Recipe Ingredients
            List<RecipeIngredientEntity> ingredients = recipeIngredientJpaRepository.findByRecipeId(recipe.getId());
            for (RecipeIngredientEntity ri : ingredients) {
                BigDecimal totalQty = ri.getQuantity().multiply(BigDecimal.valueOf(item.getQuantity()));
                requiredIngredients.merge(ri.getIngredientId(), totalQty, BigDecimal::add);
            }

            // Process toppings
            if (item.getToppingIds() != null) {
                for (UUID toppingId : item.getToppingIds()) {
                    RecipeEntity toppingRecipe = recipeJpaRepository
                            .findByProductIdAndVariantIdIsNull(toppingId)
                            .orElseThrow(() -> new BusinessException("Không tìm thấy công thức cho topping: " + toppingId));

                    List<RecipeIngredientEntity> toppingIngredients = recipeIngredientJpaRepository.findByRecipeId(toppingRecipe.getId());
                    for (RecipeIngredientEntity ri : toppingIngredients) {
                        BigDecimal totalQty = ri.getQuantity().multiply(BigDecimal.valueOf(item.getQuantity()));
                        requiredIngredients.merge(ri.getIngredientId(), totalQty, BigDecimal::add);
                    }
                }
            }
        }

        return requiredIngredients;
    }

    @Transactional(rollbackFor = Exception.class)
    public void deductStock(UUID orderId, List<InventoryItemRequest> items) {
        log.info("Bắt đầu trừ kho cho đơn hàng: {}", orderId);
        Map<UUID, BigDecimal> required = calculateRequiredIngredients(items);

        for (Map.Entry<UUID, BigDecimal> entry : required.entrySet()) {
            UUID ingredientId = entry.getKey();
            BigDecimal quantityNeeded = entry.getValue();

            // Fetch current stock to record in transactions
            IngredientEntity ingredient = ingredientJpaRepository.findById(ingredientId)
                    .orElseThrow(() -> new BusinessException("Không tìm thấy nguyên liệu có ID: " + ingredientId));

            BigDecimal quantityBefore = ingredient.getCurrentStock();

            // Atomic update in DB
            int rowsAffected = ingredientJpaRepository.deductStock(ingredientId, quantityNeeded);
            if (rowsAffected == 0) {
                log.warn("Không đủ nguyên liệu: {} (Yêu cầu: {}, Hiện có: {})", ingredient.getName(), quantityNeeded, quantityBefore);
                throw new BusinessException("Không đủ nguyên liệu trong kho: " + ingredient.getName());
            }

            BigDecimal quantityAfter = quantityBefore.subtract(quantityNeeded);

            // Log Transaction
            InventoryTransactionEntity tx = InventoryTransactionEntity.builder()
                    .ingredientId(ingredientId)
                    .orderId(orderId)
                    .transactionType(InventoryTransactionType.DEDUCT)
                    .quantity(quantityNeeded)
                    .quantityBefore(quantityBefore)
                    .quantityAfter(quantityAfter)
                    .note("Trừ kho tự động cho đơn hàng: " + orderId)
                    .build();

            inventoryTransactionJpaRepository.save(tx);
            log.info("Đã trừ kho nguyên liệu {}: {} -> {}", ingredient.getName(), quantityBefore, quantityAfter);
        }
    }

    @Transactional(rollbackFor = Exception.class)
    public void restoreStock(UUID orderId) {
        log.info("Bắt đầu hoàn kho cho đơn hàng: {}", orderId);
        List<InventoryTransactionEntity> deductTxs = inventoryTransactionJpaRepository.findByOrderId(orderId)
                .stream()
                .filter(tx -> tx.getTransactionType() == InventoryTransactionType.DEDUCT)
                .toList();

        if (deductTxs.isEmpty()) {
            log.warn("Không tìm thấy lịch sử trừ kho cho đơn hàng: {}", orderId);
            return;
        }

        for (InventoryTransactionEntity deductTx : deductTxs) {
            UUID ingredientId = deductTx.getIngredientId();
            BigDecimal quantityToRestore = deductTx.getQuantity();

            IngredientEntity ingredient = ingredientJpaRepository.findById(ingredientId)
                    .orElseThrow(() -> new BusinessException("Không tìm thấy nguyên liệu có ID: " + ingredientId));

            BigDecimal quantityBefore = ingredient.getCurrentStock();

            // Atomic update in DB
            ingredientJpaRepository.addStock(ingredientId, quantityToRestore);

            BigDecimal quantityAfter = quantityBefore.add(quantityToRestore);

            // Log Transaction
            InventoryTransactionEntity restoreTx = InventoryTransactionEntity.builder()
                    .ingredientId(ingredientId)
                    .orderId(orderId)
                    .transactionType(InventoryTransactionType.RESTORE)
                    .quantity(quantityToRestore)
                    .quantityBefore(quantityBefore)
                    .quantityAfter(quantityAfter)
                    .note("Hoàn kho tự động cho đơn hàng bị hủy: " + orderId)
                    .build();

            inventoryTransactionJpaRepository.save(restoreTx);
            log.info("Đã hoàn kho nguyên liệu {}: {} -> {}", ingredient.getName(), quantityBefore, quantityAfter);
        }
    }

    public boolean checkAvailability(List<InventoryItemRequest> items) {
        try {
            Map<UUID, BigDecimal> required = calculateRequiredIngredients(items);
            for (Map.Entry<UUID, BigDecimal> entry : required.entrySet()) {
                UUID ingredientId = entry.getKey();
                BigDecimal quantityNeeded = entry.getValue();

                IngredientEntity ingredient = ingredientJpaRepository.findById(ingredientId)
                        .orElse(null);

                if (ingredient == null || !ingredient.getIsActive() || ingredient.getCurrentStock().compareTo(quantityNeeded) < 0) {
                    return false;
                }
            }
            return true;
        } catch (BusinessException e) {
            log.warn("Lỗi kiểm tra tính khả dụng: {}", e.getMessage());
            return false;
        }
    }

    public int calculateMaxPortions(UUID productId, UUID variantId) {
        RecipeEntity recipe = recipeJpaRepository
                .findByProductIdAndVariantId(productId, variantId)
                .or(() -> recipeJpaRepository.findByProductIdAndVariantIdIsNull(productId))
                .orElse(null);

        if (recipe == null || !recipe.getIsActive()) {
            return 0;
        }

        List<RecipeIngredientEntity> ingredients = recipeIngredientJpaRepository.findByRecipeId(recipe.getId());
        if (ingredients.isEmpty()) {
            return 0;
        }

        BigDecimal maxPortions = null;

        for (RecipeIngredientEntity ri : ingredients) {
            IngredientEntity ingredient = ingredientJpaRepository.findById(ri.getIngredientId())
                    .orElse(null);

            if (ingredient == null || !ingredient.getIsActive() || ri.getQuantity().compareTo(BigDecimal.ZERO) <= 0) {
                return 0;
            }

            BigDecimal currentStock = ingredient.getCurrentStock();
            BigDecimal portions = currentStock.divide(ri.getQuantity(), 0, RoundingMode.FLOOR);

            if (maxPortions == null || portions.compareTo(maxPortions) < 0) {
                maxPortions = portions;
            }
        }

        return maxPortions == null ? 0 : maxPortions.intValue();
    }
}
