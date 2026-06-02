package com.beverage.inventory.presentation.controller;

import com.beverage.inventory.application.dto.response.IngredientResponse;
import com.beverage.inventory.application.dto.response.InventoryTransactionResponse;
import com.beverage.inventory.application.usecase.InventoryUseCase;
import com.beverage.inventory.common.ApiResponse;
import com.beverage.inventory.domain.model.InventoryTransactionType;
import com.beverage.inventory.infrastructure.persistence.entity.IngredientEntity;
import com.beverage.inventory.infrastructure.persistence.entity.InventoryTransactionEntity;
import com.beverage.inventory.infrastructure.persistence.repository.IngredientJpaRepository;
import com.beverage.inventory.infrastructure.persistence.repository.InventoryTransactionJpaRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/inventory")
@RequiredArgsConstructor
@Tag(name = "Admin Inventory Metrics", description = "Truy vấn tồn kho và lịch sử giao dịch (Admin only)")
@SecurityRequirement(name = "bearerAuth")
public class AdminInventoryController {

    private final InventoryUseCase inventoryUseCase;
    private final IngredientJpaRepository ingredientJpaRepository;
    private final InventoryTransactionJpaRepository inventoryTransactionJpaRepository;

    @GetMapping("/stock")
    @Operation(summary = "Xem tồn kho của tất cả nguyên liệu (Hỗ trợ lọc cảnh báo tồn kho thấp và phân trang)")
    public ResponseEntity<ApiResponse<List<IngredientResponse>>> getStock(
            @RequestParam(name = "low_stock", defaultValue = "false") boolean lowStock,
            @PageableDefault(size = 20, sort = "name") Pageable pageable
    ) {
        Page<IngredientEntity> page = ingredientJpaRepository.findStock(lowStock, pageable);
        List<IngredientResponse> responses = page.getContent().stream()
                .map(entity -> IngredientResponse.builder()
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
                        .build())
                .toList();

        return ResponseEntity.ok(ApiResponse.paged(responses, "Lấy danh sách tồn kho thành công", page));
    }

    @GetMapping("/stock/{productId}/{variantId}")
    @Operation(summary = "Tính số ly tối đa có thể pha được của một sản phẩm/biến thể")
    public ResponseEntity<ApiResponse<Integer>> getProductMaxPortions(
            @PathVariable UUID productId,
            @PathVariable String variantId
    ) {
        UUID varId = null;
        if (variantId != null && !variantId.equalsIgnoreCase("null") && !variantId.equalsIgnoreCase("all")) {
            varId = UUID.fromString(variantId);
        }

        int maxPortions = inventoryUseCase.calculateMaxPortions(productId, varId);
        return ResponseEntity.ok(ApiResponse.success(maxPortions, "Tính toán số lượng pha chế tối đa thành công"));
    }

    @GetMapping("/transactions")
    @Operation(summary = "Xem lịch sử nhập xuất kho có bộ lọc và phân trang")
    public ResponseEntity<ApiResponse<List<InventoryTransactionResponse>>> getTransactions(
            @RequestParam(required = false) UUID ingredientId,
            @RequestParam(required = false) UUID orderId,
            @RequestParam(required = false) InventoryTransactionType transactionType,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable
    ) {
        Page<InventoryTransactionEntity> page = inventoryTransactionJpaRepository
                .findTransactionsWithFilters(ingredientId, orderId, transactionType, pageable);

        Page<InventoryTransactionResponse> responsePage = page.map(tx -> {
            String ingredientName = "Không xác định";
            IngredientEntity ingredient = ingredientJpaRepository.findById(tx.getIngredientId()).orElse(null);
            if (ingredient != null) {
                ingredientName = ingredient.getName();
            }
            return InventoryTransactionResponse.builder()
                    .id(tx.getId())
                    .ingredientId(tx.getIngredientId())
                    .ingredientName(ingredientName)
                    .orderId(tx.getOrderId())
                    .transactionType(tx.getTransactionType())
                    .quantity(tx.getQuantity())
                    .quantityBefore(tx.getQuantityBefore())
                    .quantityAfter(tx.getQuantityAfter())
                    .note(tx.getNote())
                    .createdAt(tx.getCreatedAt())
                    .build();
        });

        return ResponseEntity.ok(ApiResponse.paged(responsePage.getContent(), "Lấy lịch sử giao dịch kho thành công", responsePage));
    }

    @GetMapping("/toppings")
    @Operation(summary = "Xem danh sách tồn kho của riêng các Toppings")
    public ResponseEntity<ApiResponse<List<IngredientResponse>>> getToppingsStock() {
        List<IngredientResponse> responses = inventoryUseCase.getToppingsStock();
        return ResponseEntity.ok(ApiResponse.success(responses, "Lấy danh sách tồn kho toppings thành công"));
    }
}
