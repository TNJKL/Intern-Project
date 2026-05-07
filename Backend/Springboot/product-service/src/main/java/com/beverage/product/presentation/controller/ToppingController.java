package com.beverage.product.presentation.controller;

import com.beverage.product.application.dto.request.CreateToppingRequest;
import com.beverage.product.application.dto.request.UpdateToppingRequest;
import com.beverage.product.application.dto.response.ToppingResponse;
import com.beverage.product.application.usecase.ToppingUseCase;
import com.beverage.product.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/toppings")
@RequiredArgsConstructor
@Tag(name = "Toppings", description = "Toppings (add-ons) cho đồ uống")
public class ToppingController {

    private final ToppingUseCase toppingUseCase;

    @GetMapping
    @Operation(summary = "Public - List active toppings")
    public ResponseEntity<ApiResponse<List<ToppingResponse>>> listActive() {
        return ResponseEntity.ok(ApiResponse.success(toppingUseCase.listToppingsActive(),
                "Lấy danh sách toppings thành công"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Public - Get topping by id")
    public ResponseEntity<ApiResponse<ToppingResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(toppingUseCase.getToppingById(id),
                "Lấy topping thành công"));
    }

    @PostMapping
    @Operation(summary = "ADMIN - Create topping")
    public ResponseEntity<ApiResponse<ToppingResponse>> create(
            @Valid @RequestBody CreateToppingRequest request) {
        ToppingResponse response = toppingUseCase.createTopping(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Tạo topping thành công"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "ADMIN - Update topping")
    public ResponseEntity<ApiResponse<ToppingResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateToppingRequest request) {
        return ResponseEntity.ok(ApiResponse.success(toppingUseCase.updateTopping(id, request),
                "Cập nhật topping thành công"));
    }

    @PatchMapping("/{id}")
    @Operation(summary = "ADMIN - Patch topping (same as PUT for MVP)")
    public ResponseEntity<ApiResponse<ToppingResponse>> patch(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateToppingRequest request) {
        return update(id, request);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "ADMIN - Delete topping")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        toppingUseCase.deleteTopping(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa topping thành công"));
    }
}

