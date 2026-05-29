package com.beverage.inventory.presentation.controller;

import com.beverage.inventory.application.dto.request.CreateRecipeRequest;
import com.beverage.inventory.application.dto.response.RecipeResponse;
import com.beverage.inventory.application.usecase.RecipeUseCase;
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
@RequestMapping("/api/v1/admin/recipes")
@RequiredArgsConstructor
@Tag(name = "Admin Recipes", description = "Quản lý công thức pha chế (Admin only)")
@SecurityRequirement(name = "bearerAuth")
public class AdminRecipeController {

    private final RecipeUseCase recipeUseCase;

    @PostMapping
    @Operation(summary = "Tạo công thức pha chế mới")
    public ResponseEntity<ApiResponse<RecipeResponse>> create(@Valid @RequestBody CreateRecipeRequest request) {
        RecipeResponse response = recipeUseCase.createRecipe(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Tạo công thức thành công"));
    }

    @GetMapping
    @Operation(summary = "Danh sách công thức pha chế")
    public ResponseEntity<ApiResponse<List<RecipeResponse>>> list(
            @PageableDefault(size = 20, sort = "productName") Pageable pageable
    ) {
        Page<RecipeResponse> page = recipeUseCase.listRecipes(pageable);
        return ResponseEntity.ok(ApiResponse.paged(page.getContent(), "Lấy danh sách công thức thành công", page));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết công thức pha chế kèm nguyên liệu thành phần")
    public ResponseEntity<ApiResponse<RecipeResponse>> getById(@PathVariable UUID id) {
        RecipeResponse response = recipeUseCase.getRecipe(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy chi tiết công thức thành công"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật công thức pha chế (thay thế nguyên liệu)")
    public ResponseEntity<ApiResponse<RecipeResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody CreateRecipeRequest request
    ) {
        RecipeResponse response = recipeUseCase.updateRecipe(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật công thức thành công"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa mềm công thức pha chế")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        recipeUseCase.deleteRecipe(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa công thức thành công"));
    }
}
