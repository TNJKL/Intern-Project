package com.beverage.inventory.application.usecase;

import com.beverage.inventory.application.dto.request.CreateIngredientRequest;
import com.beverage.inventory.application.dto.request.RestockRequest;
import com.beverage.inventory.application.dto.request.UpdateIngredientRequest;
import com.beverage.inventory.application.dto.response.IngredientResponse;
import com.beverage.inventory.domain.exception.BusinessException;
import com.beverage.inventory.domain.model.InventoryTransactionType;
import com.beverage.inventory.infrastructure.persistence.entity.IngredientEntity;
import com.beverage.inventory.infrastructure.persistence.entity.InventoryTransactionEntity;
import com.beverage.inventory.infrastructure.persistence.repository.IngredientJpaRepository;
import com.beverage.inventory.infrastructure.persistence.repository.InventoryTransactionJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class IngredientUseCase {

    private final IngredientJpaRepository ingredientJpaRepository;
    private final InventoryTransactionJpaRepository inventoryTransactionJpaRepository;

    private IngredientResponse toResponse(IngredientEntity entity) {
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
                .build();
    }

    @Transactional
    public IngredientResponse createIngredient(CreateIngredientRequest request) {
        if (ingredientJpaRepository.existsById(UUID.randomUUID())) { // Just a sanity check or SKU check
            // We should check SKU uniqueness
        }
        
        ingredientJpaRepository.findAll().stream()
                .filter(i -> i.getSku().equalsIgnoreCase(request.getSku()))
                .findAny()
                .ifPresent(i -> {
                    throw new BusinessException("Mã SKU nguyên liệu đã tồn tại: " + request.getSku());
                });

        IngredientEntity entity = IngredientEntity.builder()
                .name(request.getName())
                .sku(request.getSku())
                .unit(request.getUnit())
                .currentStock(request.getCurrentStock())
                .lowStockThreshold(request.getLowStockThreshold())
                .costPerUnit(request.getCostPerUnit())
                .isActive(true)
                .build();

        IngredientEntity saved = ingredientJpaRepository.save(entity);
        log.info("Đã tạo mới nguyên liệu: {} (SKU: {})", saved.getName(), saved.getSku());
        return toResponse(saved);
    }

    public Page<IngredientResponse> listIngredients(String name, Boolean isActive, Pageable pageable) {
        Page<IngredientEntity> page = ingredientJpaRepository.findIngredientsWithFilters(name, isActive, pageable);
        return page.map(this::toResponse);
    }

    public IngredientResponse getIngredient(UUID id) {
        IngredientEntity entity = ingredientJpaRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Không tìm thấy nguyên liệu có ID: " + id));
        return toResponse(entity);
    }

    @Transactional
    public IngredientResponse updateIngredient(UUID id, UpdateIngredientRequest request) {
        IngredientEntity entity = ingredientJpaRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Không tìm thấy nguyên liệu có ID: " + id));

        if (request.getSku() != null && !request.getSku().equalsIgnoreCase(entity.getSku())) {
            ingredientJpaRepository.findAll().stream()
                    .filter(i -> !i.getId().equals(id) && i.getSku().equalsIgnoreCase(request.getSku()))
                    .findAny()
                    .ifPresent(i -> {
                        throw new BusinessException("Mã SKU nguyên liệu đã tồn tại trên một nguyên liệu khác: " + request.getSku());
                    });
            entity.setSku(request.getSku());
        }

        if (request.getName() != null) {
            entity.setName(request.getName());
        }
        if (request.getUnit() != null) {
            entity.setUnit(request.getUnit());
        }
        if (request.getLowStockThreshold() != null) {
            entity.setLowStockThreshold(request.getLowStockThreshold());
        }
        if (request.getCostPerUnit() != null) {
            entity.setCostPerUnit(request.getCostPerUnit());
        }

        IngredientEntity saved = ingredientJpaRepository.save(entity);
        log.info("Đã cập nhật nguyên liệu: {} (SKU: {})", saved.getName(), saved.getSku());
        return toResponse(saved);
    }

    @Transactional
    public void deleteIngredient(UUID id) {
        IngredientEntity entity = ingredientJpaRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Không tìm thấy nguyên liệu có ID: " + id));
        entity.setIsActive(false);
        ingredientJpaRepository.save(entity);
        log.info("Đã xóa mềm nguyên liệu ID: {}", id);
    }

    @Transactional
    public IngredientResponse restoreIngredient(UUID id) {
        IngredientEntity entity = ingredientJpaRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Không tìm thấy nguyên liệu có ID: " + id));
        entity.setIsActive(true);
        IngredientEntity saved = ingredientJpaRepository.save(entity);
        log.info("Đã khôi phục hoạt động cho nguyên liệu ID: {}", id);
        return toResponse(saved);
    }

    @Transactional(rollbackFor = Exception.class)
    public IngredientResponse restockIngredient(UUID id, RestockRequest request) {
        IngredientEntity entity = ingredientJpaRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Không tìm thấy nguyên liệu có ID: " + id));

        BigDecimal quantityBefore = entity.getCurrentStock();
        BigDecimal quantityToAdd = request.getQuantity();

        // Perform Atomic update
        ingredientJpaRepository.addStock(id, quantityToAdd);

        BigDecimal quantityAfter = quantityBefore.add(quantityToAdd);

        // Record Transaction
        InventoryTransactionEntity tx = InventoryTransactionEntity.builder()
                .ingredientId(id)
                .transactionType(InventoryTransactionType.RESTOCK)
                .quantity(quantityToAdd)
                .quantityBefore(quantityBefore)
                .quantityAfter(quantityAfter)
                .note(request.getNote() != null ? request.getNote() : "Nhập kho thêm thủ công")
                .build();

        inventoryTransactionJpaRepository.save(tx);
        log.info("Nhập kho thành công cho nguyên liệu {}: {} -> {}", entity.getName(), quantityBefore, quantityAfter);

        // Refresh entity to return latest state
        IngredientEntity updatedEntity = ingredientJpaRepository.findById(id).orElse(entity);
        return toResponse(updatedEntity);
    }
}
