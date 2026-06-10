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
import com.beverage.inventory.application.dto.response.IngredientResponse;
import com.beverage.inventory.infrastructure.client.ProductServiceClient;
import com.beverage.inventory.infrastructure.client.dto.ToppingCatalogDto;
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
    private final ProductServiceClient productServiceClient;
    private final LowStockAlertService lowStockAlertService;

    private void syncToppingIngredient(UUID toppingId) {
        if (!ingredientJpaRepository.existsById(toppingId)) {
            try {
                ToppingCatalogDto.ToppingData toppingData = productServiceClient.getTopping(toppingId);
                IngredientEntity entity = IngredientEntity.builder()
                        .id(toppingId)
                        .name(toppingData.getName())
                        .sku("TOPPING-" + toppingId.toString().substring(0, 8).toUpperCase())
                        .unit("phần")
                        .currentStock(BigDecimal.ZERO)
                        .lowStockThreshold(BigDecimal.ZERO)
                        .costPerUnit(BigDecimal.ZERO)
                        .isActive(true)
                        .build();
                ingredientJpaRepository.save(entity);
                log.info("Đã đồng bộ topping {} thành nguyên liệu thành phẩm mới.", toppingData.getName());
            } catch (Exception e) {
                log.error("Lỗi khi đồng bộ topping ID {}: {}", toppingId, e.getMessage());
                throw new BusinessException("Không thể tìm thấy hoặc đồng bộ topping: " + toppingId);
            }
        }
    }

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
                    syncToppingIngredient(toppingId);
                    BigDecimal totalQty = BigDecimal.valueOf(item.getQuantity());
                    requiredIngredients.merge(toppingId, totalQty, BigDecimal::add);
                }
            }
        }
        return requiredIngredients;
    }
      //
    @Transactional(rollbackFor = Exception.class)
    public void deductStock(UUID orderId, List<InventoryItemRequest> items) {
        log.info("Bat' dau` tru` kho cho don hang`: {}", orderId);
        Map<UUID, BigDecimal> required = calculateRequiredIngredients(items);

        for (Map.Entry<UUID, BigDecimal> entry : required.entrySet()) {
            UUID ingredientId = entry.getKey();
            BigDecimal quantityNeeded = entry.getValue();

            // Fetch current stock to record in transactions
            IngredientEntity ingredient = ingredientJpaRepository.findById(ingredientId)
                    .orElseThrow(() -> new BusinessException("Ko tim` thay' nguyen lieu. co' ID: " + ingredientId));

            BigDecimal quantityBefore = ingredient.getCurrentStock();

            // Atomic update in DB
            int rowsAffected = ingredientJpaRepository.deductStock(ingredientId, quantityNeeded);
            if (rowsAffected == 0) {
                log.warn("Khong du? nguyen lieu: {} (Yeu cau: {}, Hien co: {})", ingredient.getName(), quantityNeeded, quantityBefore);
                throw new BusinessException("Khong du? nguyen lieu trong kho: " + ingredient.getName());
            }
            // 
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

            inventoryTransactionJpaRepository.saveAndFlush(tx);
            log.info("Da tru` kho nguyen lieu {}: {} -> {}", ingredient.getName(), quantityBefore, quantityAfter);

            // Đánh giá và gửi cảnh báo tồn kho thấp (async-safe: dùng REQUIRES_NEW transaction)
            lowStockAlertService.evaluateAndAlert(ingredientId, quantityAfter);
        }
    }
    @Transactional(rollbackFor = Exception.class)
    public void restoreStock(UUID orderId) {
        log.info("Bat' dau` hoan` kho cho don' hang`: {}", orderId);

        boolean alreadyRestored = inventoryTransactionJpaRepository.findByOrderId(orderId)
                .stream()
                .anyMatch(tx -> tx.getTransactionType() == InventoryTransactionType.RESTORE 
                             || tx.getTransactionType() == InventoryTransactionType.MANUAL_RESTORE);
        if (alreadyRestored) {
            log.warn("Don` hang` {} da~ duoc. hoan` kho truoc' do'. Bo? qua.", orderId);
            return;
        }

        List<InventoryTransactionEntity> deductTxs = inventoryTransactionJpaRepository.findByOrderId(orderId)
                .stream()
                .filter(tx -> tx.getTransactionType() == InventoryTransactionType.DEDUCT)
                .toList();

        if (deductTxs.isEmpty()) {
            log.warn("Ko tim` thay' lich su? tru` kho cho don hang`: {}", orderId);
            return;
        }

        for (InventoryTransactionEntity deductTx : deductTxs) {
            UUID ingredientId = deductTx.getIngredientId();
            BigDecimal quantityToRestore = deductTx.getQuantity();

            IngredientEntity ingredient = ingredientJpaRepository.findById(ingredientId)
                    .orElseThrow(() -> new BusinessException("Ko tim` thay' nguyen lieu co' ID: " + ingredientId));

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

            inventoryTransactionJpaRepository.saveAndFlush(restoreTx);
            log.info("Da hoan` kho nguyen lieu {}: {} -> {}", ingredient.getName(), quantityBefore, quantityAfter);

            // Reset cờ alert và tự động kích hoạt lại nguyên liệu nếu trước đó bị deactive do hết hàng
            lowStockAlertService.resetAlertOnRestock(ingredientId);
        }
    }

    @Transactional(rollbackFor = Exception.class)
    public void manualRestoreStock(UUID orderId, UUID adminId, String note) {
        log.info("Bắt đầu hoàn kho thủ công cho đơn hàng: {} bởi admin: {}", orderId, adminId);

        boolean alreadyRestored = inventoryTransactionJpaRepository.findByOrderId(orderId)
                .stream()
                .anyMatch(tx -> tx.getTransactionType() == InventoryTransactionType.RESTORE 
                             || tx.getTransactionType() == InventoryTransactionType.MANUAL_RESTORE);
        if (alreadyRestored) {
            log.warn("Đơn hàng {} đã được hoàn kho trước đó. Bỏ qua.", orderId);
            throw new BusinessException("Đơn hàng này đã được hoàn kho trước đó.");
        }

        List<InventoryTransactionEntity> deductTxs = inventoryTransactionJpaRepository.findByOrderId(orderId)
                .stream()
                .filter(tx -> tx.getTransactionType() == InventoryTransactionType.DEDUCT)
                .toList();

        if (deductTxs.isEmpty()) {
            log.warn("Không tìm thấy lịch sử trừ kho cho đơn hàng: {}", orderId);
            throw new BusinessException("Không tìm thấy lịch sử trừ kho cho đơn hàng: " + orderId);
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
                    .transactionType(InventoryTransactionType.MANUAL_RESTORE)
                    .quantity(quantityToRestore)
                    .quantityBefore(quantityBefore)
                    .quantityAfter(quantityAfter)
                    .note(note != null ? note : "Hoàn kho thủ công cho đơn hàng: " + orderId)
                    .createdBy(adminId)
                    .build();

            inventoryTransactionJpaRepository.saveAndFlush(restoreTx);
            log.info("Đã hoàn kho thủ công nguyên liệu {}: {} -> {}", ingredient.getName(), quantityBefore, quantityAfter);

            // Reset cờ alert và tự động kích hoạt lại nguyên liệu nếu trước đó bị deactive do hết hàng
            lowStockAlertService.resetAlertOnRestock(ingredientId);
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

    public void validateStockAvailability(List<InventoryItemRequest> items) {
        Map<UUID, BigDecimal> required = calculateRequiredIngredients(items);
        for (Map.Entry<UUID, BigDecimal> entry : required.entrySet()) {
            UUID ingredientId = entry.getKey();
            BigDecimal quantityNeeded = entry.getValue();

            IngredientEntity ingredient = ingredientJpaRepository.findById(ingredientId)
                    .orElseThrow(() -> new BusinessException("Ko tim` thay' nguyen lieu co' ID: " + ingredientId));

            if (!ingredient.getIsActive()) {
                throw new BusinessException("Nguyen lieu. ngung` hoat. dong.: " + ingredient.getName());
            }

            if (ingredient.getCurrentStock().compareTo(quantityNeeded) < 0) {
                throw new BusinessException("Khong du? nguyen lieu trong kho: " + ingredient.getName());
            }
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

    @Transactional
    public List<IngredientResponse> getToppingsStock() {
        var toppings = productServiceClient.getAllToppings();
        for (var topping : toppings) {
            UUID toppingId = topping.getId();
            var existingOpt = ingredientJpaRepository.findById(toppingId);
            if (existingOpt.isEmpty()) {
                try {
                    IngredientEntity entity = IngredientEntity.builder()
                            .id(toppingId)
                            .name(topping.getName())
                            .sku("TOPPING-" + toppingId.toString().substring(0, 8).toUpperCase())
                            .unit("phần")
                            .currentStock(BigDecimal.ZERO)
                            .lowStockThreshold(BigDecimal.ZERO)
                            .costPerUnit(BigDecimal.ZERO)
                            .isActive(true)
                            .build();
                    ingredientJpaRepository.save(entity);
                    log.info("Đã tự động đồng bộ topping {} khi lấy tồn kho", topping.getName());
                } catch (Exception e) {
                    log.error("Lỗi đồng bộ topping {} khi lấy tồn kho: {}", topping.getId(), e.getMessage());
                }
            } else {
                IngredientEntity entity = existingOpt.get();
                if (!entity.getName().equals(topping.getName())) {
                    entity.setName(topping.getName());
                    ingredientJpaRepository.save(entity);
                    log.info("Đã cập nhật tên mới cho topping {} -> {}", entity.getId(), topping.getName());
                }
            }
        }

        List<UUID> toppingIds = toppings.stream().map(t -> t.getId()).toList();
        if (toppingIds.isEmpty()) {
            return List.of();
        }

        List<IngredientEntity> entities = ingredientJpaRepository.findAllById(toppingIds);
        return entities.stream().map(this::toResponse).toList();
    }

    private IngredientResponse toResponse(IngredientEntity entity) {
        int pct = entity.getCriticalStockThresholdPct() != null ? entity.getCriticalStockThresholdPct() : 5;
        java.math.BigDecimal criticalAbsolute = entity.getLowStockThreshold()
                .multiply(java.math.BigDecimal.valueOf(pct))
                .divide(java.math.BigDecimal.valueOf(100), 3, java.math.RoundingMode.HALF_UP);

        java.math.BigDecimal stock = entity.getCurrentStock();
        com.beverage.inventory.domain.model.StockAlertLevel level;
        if (stock.compareTo(java.math.BigDecimal.ZERO) <= 0) {
            level = com.beverage.inventory.domain.model.StockAlertLevel.OUT_OF_STOCK;
        } else if (stock.compareTo(criticalAbsolute) <= 0) {
            level = com.beverage.inventory.domain.model.StockAlertLevel.CRITICAL;
        } else if (stock.compareTo(entity.getLowStockThreshold()) <= 0) {
            level = com.beverage.inventory.domain.model.StockAlertLevel.LOW;
        } else {
            level = com.beverage.inventory.domain.model.StockAlertLevel.NORMAL;
        }

        return IngredientResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .sku(entity.getSku())
                .unit(entity.getUnit())
                .currentStock(entity.getCurrentStock())
                .lowStockThreshold(entity.getLowStockThreshold())
                .costPerUnit(entity.getCostPerUnit())
                .isActive(entity.getIsActive())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .criticalStockThresholdPct(pct)
                .criticalAbsolute(criticalAbsolute)
                .alertLevel(level.name())
                .lowStockAlertSentAt(entity.getLowStockAlertSentAt())
                .build();
    }
}
