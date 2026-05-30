package com.beverage.inventory.application.usecase;

import com.beverage.inventory.application.dto.request.CreateRecipeRequest;
import com.beverage.inventory.application.dto.request.RecipeIngredientRequest;
import com.beverage.inventory.application.dto.response.RecipeIngredientResponse;
import com.beverage.inventory.application.dto.response.RecipeResponse;
import com.beverage.inventory.domain.exception.BusinessException;
import com.beverage.inventory.infrastructure.persistence.entity.IngredientEntity;
import com.beverage.inventory.infrastructure.persistence.entity.RecipeEntity;
import com.beverage.inventory.infrastructure.persistence.entity.RecipeIngredientEntity;
import com.beverage.inventory.infrastructure.persistence.repository.IngredientJpaRepository;
import com.beverage.inventory.infrastructure.persistence.repository.RecipeIngredientJpaRepository;
import com.beverage.inventory.infrastructure.persistence.repository.RecipeJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecipeUseCase {

    private final RecipeJpaRepository recipeJpaRepository;
    private final RecipeIngredientJpaRepository recipeIngredientJpaRepository;
    private final IngredientJpaRepository ingredientJpaRepository;

    private RecipeResponse toResponse(RecipeEntity recipe) {
        List<RecipeIngredientEntity> riEntities = recipeIngredientJpaRepository.findByRecipeId(recipe.getId());
        List<RecipeIngredientResponse> riResponses = riEntities.stream()
                .map(ri -> {
                    String ingredientName = "Không xác định";
                    String unit = "";
                    IngredientEntity ingredient = ingredientJpaRepository.findById(ri.getIngredientId()).orElse(null);
                    if (ingredient != null) {
                        ingredientName = ingredient.getName();
                        unit = ingredient.getUnit();
                    }
                    return RecipeIngredientResponse.builder()
                            .id(ri.getId())
                            .ingredientId(ri.getIngredientId())
                            .ingredientName(ingredientName)
                            .unit(unit)
                            .quantity(ri.getQuantity())
                            .build();
                })
                .toList();

        return RecipeResponse.builder()
                .id(recipe.getId())
                .productId(recipe.getProductId())
                .variantId(recipe.getVariantId())
                .productName(recipe.getProductName())
                .version(recipe.getVersion())
                .isActive(recipe.getIsActive())
                .ingredients(riResponses)
                .createdAt(recipe.getCreatedAt())
                .updatedAt(recipe.getUpdatedAt())
                .build();
    }

    @Transactional
    public RecipeResponse createRecipe(CreateRecipeRequest request) {
        // Validate uniqueness of product_id + variant_id for active recipes
        recipeJpaRepository.findByProductIdAndVariantId(request.getProductId(), request.getVariantId())
                .stream()
                .filter(RecipeEntity::getIsActive)
                .findFirst()
                .ifPresent(r -> {
                    throw new BusinessException("Công thức pha chế cho sản phẩm/biến thể này đã tồn tại.");
                });

        RecipeEntity recipe = RecipeEntity.builder()
                .productId(request.getProductId())
                .variantId(request.getVariantId())
                .productName(request.getProductName())
                .version(request.getVersion() != null ? request.getVersion() : 1)
                .isActive(true)
                .build();

        RecipeEntity savedRecipe = recipeJpaRepository.save(recipe);

        for (RecipeIngredientRequest riRequest : request.getIngredients()) {
            ingredientJpaRepository.findById(riRequest.getIngredientId())
                    .orElseThrow(() -> new BusinessException("Không tìm thấy nguyên liệu có ID: " + riRequest.getIngredientId()));

            RecipeIngredientEntity ri = RecipeIngredientEntity.builder()
                    .recipeId(savedRecipe.getId())
                    .ingredientId(riRequest.getIngredientId())
                    .quantity(riRequest.getQuantity())
                    .build();

            recipeIngredientJpaRepository.save(ri);
        }

        log.info("Đã tạo mới công thức: {} (ID: {})", savedRecipe.getProductName(), savedRecipe.getId());
        return toResponse(savedRecipe);
    }

    public Page<RecipeResponse> listRecipes(Pageable pageable) {
        Page<RecipeEntity> page = recipeJpaRepository.findAll(pageable);
        return page.map(this::toResponse);
    }

    public RecipeResponse getRecipe(UUID id) {
        RecipeEntity recipe = recipeJpaRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Không tìm thấy công thức có ID: " + id));
        return toResponse(recipe);
    }

    @Transactional
    public RecipeResponse updateRecipe(UUID id, CreateRecipeRequest request) {
        RecipeEntity recipe = recipeJpaRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Không tìm thấy công thức có ID: " + id));

        // Delete all old ingredients mapping
        List<RecipeIngredientEntity> oldIngredients = recipeIngredientJpaRepository.findByRecipeId(recipe.getId());
        recipeIngredientJpaRepository.deleteAll(oldIngredients);

        // Update main recipe attributes
        recipe.setProductName(request.getProductName());
        recipe.setProductId(request.getProductId());
        recipe.setVariantId(request.getVariantId());
        if (request.getVersion() != null) {
            recipe.setVersion(request.getVersion());
        }

        RecipeEntity savedRecipe = recipeJpaRepository.save(recipe);

        // Save new recipe ingredients
        for (RecipeIngredientRequest riRequest : request.getIngredients()) {
            ingredientJpaRepository.findById(riRequest.getIngredientId())
                    .orElseThrow(() -> new BusinessException("Không tìm thấy nguyên liệu có ID: " + riRequest.getIngredientId()));

            RecipeIngredientEntity ri = RecipeIngredientEntity.builder()
                    .recipeId(savedRecipe.getId())
                    .ingredientId(riRequest.getIngredientId())
                    .quantity(riRequest.getQuantity())
                    .build();

            recipeIngredientJpaRepository.save(ri);
        }

        log.info("Đã cập nhật công thức: {} (ID: {})", savedRecipe.getProductName(), savedRecipe.getId());
        return toResponse(savedRecipe);
    }

    @Transactional
    public void deleteRecipe(UUID id) {
        RecipeEntity recipe = recipeJpaRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Không tìm thấy công thức có ID: " + id));
        recipe.setIsActive(false);
        recipeJpaRepository.save(recipe);
        log.info("Đã xóa mềm công thức ID: {}", id);
    }
}
