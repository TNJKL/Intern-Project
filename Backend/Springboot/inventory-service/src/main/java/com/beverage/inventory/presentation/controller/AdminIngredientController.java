package com.beverage.inventory.presentation.controller;

import com.beverage.inventory.application.dto.request.CreateIngredientRequest;
import com.beverage.inventory.application.dto.request.RestockRequest;
import com.beverage.inventory.application.dto.request.UpdateIngredientRequest;
import com.beverage.inventory.application.dto.response.IngredientResponse;
import com.beverage.inventory.application.usecase.IngredientUseCase;
import com.beverage.inventory.common.ApiResponse;
import com.beverage.inventory.domain.model.StockAlertLevel;
import com.beverage.inventory.infrastructure.persistence.repository.IngredientJpaRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import com.beverage.shared.jwt.JwtUserPrincipal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/ingredients")
@RequiredArgsConstructor
@Tag(name = "Admin Ingredients", description = "Quản lý nguyên liệu kho hàng (Admin only)")
@SecurityRequirement(name = "bearerAuth")
public class AdminIngredientController {

    private final IngredientUseCase ingredientUseCase;
    private final IngredientJpaRepository ingredientJpaRepository;

    @PostMapping
    @Operation(summary = "Tạo nguyên liệu mới")
    public ResponseEntity<ApiResponse<IngredientResponse>> create(@Valid @RequestBody CreateIngredientRequest request) {
        IngredientResponse response = ingredientUseCase.createIngredient(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Tạo nguyên liệu thành công"));
    }

    @GetMapping
    @Operation(summary = "Danh sách nguyên liệu có phân trang và lọc")
    public ResponseEntity<ApiResponse<List<IngredientResponse>>> list(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false, defaultValue = "false") Boolean excludeToppings,
            @PageableDefault(size = 20, sort = "name") Pageable pageable
    ) {
        Page<IngredientResponse> page = ingredientUseCase.listIngredients(name, isActive, excludeToppings, pageable);
        return ResponseEntity.ok(ApiResponse.paged(page.getContent(), "Lấy danh sách nguyên liệu thành công", page));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết nguyên liệu")
    public ResponseEntity<ApiResponse<IngredientResponse>> getById(@PathVariable UUID id) {
        IngredientResponse response = ingredientUseCase.getIngredient(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy chi tiết nguyên liệu thành công"));
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Cập nhật nguyên liệu")
    public ResponseEntity<ApiResponse<IngredientResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateIngredientRequest request
    ) {
        IngredientResponse response = ingredientUseCase.updateIngredient(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật nguyên liệu thành công"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa mềm nguyên liệu")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        ingredientUseCase.deleteIngredient(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa nguyên liệu thành công"));
    }

    @PostMapping("/{id}/restock")
    @Operation(summary = "Nhập kho thêm nguyên liệu")
    public ResponseEntity<ApiResponse<IngredientResponse>> restock(
            @PathVariable UUID id,
            @Valid @RequestBody RestockRequest request,
            @AuthenticationPrincipal JwtUserPrincipal principal
    ) {
        UUID adminId = principal != null ? principal.getUserId() : null;
        IngredientResponse response = ingredientUseCase.restockIngredient(id, request, adminId);
        return ResponseEntity.ok(ApiResponse.success(response, "Nhập kho thêm nguyên liệu thành công"));
    }

    @PostMapping("/{id}/restore")
    @Operation(summary = "Khôi phục nguyên liệu đã xóa mềm")
    public ResponseEntity<ApiResponse<IngredientResponse>> restore(@PathVariable UUID id) {
        IngredientResponse response = ingredientUseCase.restoreIngredient(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Khôi phục nguyên liệu thành công"));
    }

    // -----------------------------------------------------------------------
    // Low Stock Alert Endpoints — Admin Dashboard
    // -----------------------------------------------------------------------

    /**
     * Trả về danh sách nguyên liệu đang ở trạng thái cảnh báo (LOW / CRITICAL / OUT_OF_STOCK).
     * Frontend admin gọi endpoint này khi F5 hoặc polling mỗi 30-60s để cập nhật badge đỏ.
     * NestJS WebSocket đẩy real-time khi nhận Kafka event — endpoint này là fallback bền vững.
     */
    @GetMapping("/alerts")
    @Operation(summary = "Danh sách nguyên liệu đang ở ngưỡng cảnh báo tồn kho")
    public ResponseEntity<ApiResponse<List<IngredientResponse>>> getAlerts() {
        List<IngredientResponse> alerts = ingredientJpaRepository.findAllLowStockIngredients()
                .stream()
                .map(entity -> {
                    int pct = entity.getCriticalStockThresholdPct() != null ? entity.getCriticalStockThresholdPct() : 5;
                    BigDecimal criticalAbsolute = entity.getLowStockThreshold()
                            .multiply(BigDecimal.valueOf(pct))
                            .divide(BigDecimal.valueOf(100), 3, RoundingMode.HALF_UP);

                    BigDecimal stock = entity.getCurrentStock();
                    StockAlertLevel level;
                    if (stock.compareTo(BigDecimal.ZERO) <= 0) {
                        level = StockAlertLevel.OUT_OF_STOCK;
                    } else if (stock.compareTo(criticalAbsolute) <= 0) {
                        level = StockAlertLevel.CRITICAL;
                    } else {
                        level = StockAlertLevel.LOW;
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
                            .criticalStockThresholdPct(pct)
                            .criticalAbsolute(criticalAbsolute)
                            .alertLevel(level.name())
                            .lowStockAlertSentAt(entity.getLowStockAlertSentAt())
                            .createdAt(entity.getCreatedAt())
                            .updatedAt(entity.getUpdatedAt())
                            .build();
                })
                .toList();

        return ResponseEntity.ok(ApiResponse.success(alerts,
                "Lấy danh sách nguyên liệu cần cảnh báo thành công (" + alerts.size() + " nguyên liệu)"));
    }

    /**
     * Trả về số lượng nguyên liệu đang ở trạng thái cảnh báo.
     * Dùng cho badge số đỏ ở navbar admin — gọi nhẹ hơn /alerts.
     */
    @GetMapping("/alerts/count")
    @Operation(summary = "Số lượng nguyên liệu đang cảnh báo (dùng cho badge navbar)")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getAlertCount() {
        long count = ingredientJpaRepository.countLowStockIngredients();
        return ResponseEntity.ok(ApiResponse.success(Map.of("count", count),
                "Lấy số lượng cảnh báo thành công"));
    }
}
