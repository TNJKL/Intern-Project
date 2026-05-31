package com.beverage.inventory.presentation.controller;

import com.beverage.inventory.application.dto.request.CreateIngredientRequest;
import com.beverage.inventory.application.dto.request.RestockRequest;
import com.beverage.inventory.application.dto.request.UpdateIngredientRequest;
import com.beverage.inventory.application.dto.response.IngredientResponse;
import com.beverage.inventory.application.usecase.IngredientUseCase;
import com.beverage.inventory.common.ApiResponse;
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
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/ingredients")
@RequiredArgsConstructor
@Tag(name = "Admin Ingredients", description = "Quản lý nguyên liệu kho hàng (Admin only)")
@SecurityRequirement(name = "bearerAuth")
public class AdminIngredientController {

    private final IngredientUseCase ingredientUseCase;

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
            @PageableDefault(size = 20, sort = "name") Pageable pageable
    ) {
        Page<IngredientResponse> page = ingredientUseCase.listIngredients(name, isActive, pageable);
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
            @Valid @RequestBody RestockRequest request
    ) {
        IngredientResponse response = ingredientUseCase.restockIngredient(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Nhập kho thêm nguyên liệu thành công"));
    }

    @PostMapping("/{id}/restore")
    @Operation(summary = "Khôi phục nguyên liệu đã xóa mềm")
    public ResponseEntity<ApiResponse<IngredientResponse>> restore(@PathVariable UUID id) {
        IngredientResponse response = ingredientUseCase.restoreIngredient(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Khôi phục nguyên liệu thành công"));
    }
}
