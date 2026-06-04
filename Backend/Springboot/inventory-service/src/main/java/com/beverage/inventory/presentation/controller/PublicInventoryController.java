package com.beverage.inventory.presentation.controller;

import com.beverage.inventory.application.dto.InventoryItemRequest;
import com.beverage.inventory.application.usecase.InventoryUseCase;
import com.beverage.inventory.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
@Tag(name = "Public Inventory", description = "Kiểm tra tồn kho công khai (nội bộ hoặc công cộng)")
public class PublicInventoryController {

    private final InventoryUseCase inventoryUseCase;

    @PostMapping("/check-availability")
    @Operation(summary = "Kiểm tra tính khả dụng của tồn kho sản phẩm và toppings")
    public ResponseEntity<ApiResponse<Void>> checkAvailability(
            @Valid @RequestBody List<InventoryItemRequest> request
    ) {
        inventoryUseCase.validateStockAvailability(request);
        return ResponseEntity.ok(ApiResponse.success(null, "Tồn kho khả dụng"));
    }
}
