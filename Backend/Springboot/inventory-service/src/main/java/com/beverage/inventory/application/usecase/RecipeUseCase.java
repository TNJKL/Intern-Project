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
import com.beverage.inventory.infrastructure.client.ProductServiceClient;
import com.beverage.inventory.infrastructure.client.dto.ProductCatalogDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecipeUseCase {

    private final RecipeJpaRepository recipeJpaRepository;
    private final RecipeIngredientJpaRepository recipeIngredientJpaRepository;
    private final IngredientJpaRepository ingredientJpaRepository;
    private final ProductServiceClient productServiceClient;

    /**
     * Build RecipeResponse từ dữ liệu đã batch load sẵn — không có bất kỳ DB query nào trong hàm này.
     *
     * @param recipe       RecipeEntity cần convert
     * @param riEntities   Danh sách RecipeIngredientEntity của recipe này (đã fetch sẵn)
     * @param ingredientMap Map<ingredientId, IngredientEntity> đã batch load sẵn
     */
    private RecipeResponse toResponse(RecipeEntity recipe,
                                      List<RecipeIngredientEntity> riEntities,
                                      Map<UUID, IngredientEntity> ingredientMap) {
        List<RecipeIngredientResponse> riResponses = riEntities.stream()
                .map(ri -> {
                    IngredientEntity ingredient = ingredientMap.get(ri.getIngredientId());
                    return RecipeIngredientResponse.builder()
                            .id(ri.getId())
                            .ingredientId(ri.getIngredientId())
                            .ingredientName(ingredient != null ? ingredient.getName() : "Không xác định")
                            .unit(ingredient != null ? ingredient.getUnit() : "")
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

    /**
     * Batch load tất cả ingredients của 1 recipe rồi gọi toResponse.
     * Dùng cho các method xử lý đơn lẻ (getRecipe, createRecipe, v.v.).
     * Tổng: 2 queries (1 lấy recipe_ingredients + 1 lấy ingredients).
     */
    private RecipeResponse toResponseWithBatchLoad(RecipeEntity recipe) {
        List<RecipeIngredientEntity> riEntities = recipeIngredientJpaRepository.findByRecipeId(recipe.getId());
        Set<UUID> ingredientIds = riEntities.stream()
                .map(RecipeIngredientEntity::getIngredientId)
                .collect(Collectors.toSet());
        Map<UUID, IngredientEntity> ingredientMap = ingredientJpaRepository.findAllById(ingredientIds)
                .stream()
                .collect(Collectors.toMap(IngredientEntity::getId, e -> e));
        return toResponse(recipe, riEntities, ingredientMap);
    }

    @Transactional
    public RecipeResponse createRecipe(CreateRecipeRequest request) {
        // Validate product and variant in product-service
        ProductCatalogDto.ProductData productData = productServiceClient.getProduct(request.getProductId());
        String computedRecipeName = productData.getName();
        if (request.getVariantId() != null) {
            ProductCatalogDto.VariantData variant = productData.getVariants().stream()
                    .filter(v -> v.getId().equals(request.getVariantId()))
                    .findFirst()
                    .orElseThrow(() -> new BusinessException("Biến thể không hợp lệ cho sản phẩm này."));
            computedRecipeName = productData.getName() + " (" + variant.getSizeLabel() + ")";
        }

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
                .productName(computedRecipeName)
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
        return toResponseWithBatchLoad(savedRecipe);
    }

    public Page<RecipeResponse> listRecipes(Boolean isActive, Pageable pageable) {
        Page<RecipeEntity> page = recipeJpaRepository.findRecipesWithFilters(isActive, pageable);

        // Query 2: batch load tất cả recipe_ingredient của cả page trong 1 query (WHERE recipe_id IN (...))
        List<UUID> recipeIds = page.getContent().stream()
                .map(RecipeEntity::getId)
                .toList();
        List<RecipeIngredientEntity> allRiEntities = recipeIngredientJpaRepository.findByRecipeIdIn(recipeIds);

        // Group theo recipeId để lookup O(1)
        Map<UUID, List<RecipeIngredientEntity>> riByRecipeId = allRiEntities.stream()
                .collect(Collectors.groupingBy(RecipeIngredientEntity::getRecipeId));

        // Query 3: batch load tất cả ingredients cần thiết trong 1 query (WHERE id IN (...))
        Set<UUID> allIngredientIds = allRiEntities.stream()
                .map(RecipeIngredientEntity::getIngredientId)
                .collect(Collectors.toSet());
        Map<UUID, IngredientEntity> ingredientMap = ingredientJpaRepository.findAllById(allIngredientIds)
                .stream()
                .collect(Collectors.toMap(IngredientEntity::getId, e -> e));

        // Tổng cộng cả page chỉ tốn 3 queries cố định (không phụ thuộc page size)
        return page.map(recipe -> toResponse(
                recipe,
                riByRecipeId.getOrDefault(recipe.getId(), List.of()),
                ingredientMap
        ));
    }

    public RecipeResponse getRecipe(UUID id) {
        RecipeEntity recipe = recipeJpaRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Không tìm thấy công thức có ID: " + id));
        return toResponseWithBatchLoad(recipe);
    }

    @Transactional
    public RecipeResponse updateRecipe(UUID id, CreateRecipeRequest request) {
        RecipeEntity recipe = recipeJpaRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Không tìm thấy công thức có ID: " + id));

        // Validate product and variant in product-service
        ProductCatalogDto.ProductData productData = productServiceClient.getProduct(request.getProductId());
        String computedRecipeName = productData.getName();
        if (request.getVariantId() != null) {
            ProductCatalogDto.VariantData variant = productData.getVariants().stream()
                    .filter(v -> v.getId().equals(request.getVariantId()))
                    .findFirst()
                    .orElseThrow(() -> new BusinessException("Biến thể không hợp lệ cho sản phẩm này."));
            computedRecipeName = productData.getName() + " (" + variant.getSizeLabel() + ")";
        }

        // Delete all old ingredients mapping
        List<RecipeIngredientEntity> oldIngredients = recipeIngredientJpaRepository.findByRecipeId(recipe.getId());
        recipeIngredientJpaRepository.deleteAll(oldIngredients);
        recipeIngredientJpaRepository.flush();

        // Update main recipe attributes
        recipe.setProductName(computedRecipeName);
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
        return toResponseWithBatchLoad(savedRecipe);
    }

    @Transactional
    public void deleteRecipe(UUID id) {
        RecipeEntity recipe = recipeJpaRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Không tìm thấy công thức có ID: " + id));
        recipe.setIsActive(false);
        recipeJpaRepository.save(recipe);
        log.info("Đã xóa mềm công thức ID: {}", id);
    }

    @Transactional
    public RecipeResponse restoreRecipe(UUID id) {
        RecipeEntity recipe = recipeJpaRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Không tìm thấy công thức có ID: " + id));

        // Validate uniqueness of product_id + variant_id for active recipes before restoring
        java.util.Optional<RecipeEntity> activeRecipeOpt;
        if (recipe.getVariantId() != null) {
            activeRecipeOpt = recipeJpaRepository.findByProductIdAndVariantId(recipe.getProductId(), recipe.getVariantId());
        } else {
            activeRecipeOpt = recipeJpaRepository.findByProductIdAndVariantIdIsNull(recipe.getProductId());
        }

        activeRecipeOpt.filter(r -> !r.getId().equals(id) && r.getIsActive())
                .ifPresent(r -> {
                    throw new BusinessException("Không thể khôi phục. Đã tồn tại một công thức khác đang hoạt động cho sản phẩm/biến thể này.");
                });

        recipe.setIsActive(true);
        RecipeEntity saved = recipeJpaRepository.save(recipe);
        log.info("Đã khôi phục hoạt động cho công thức ID: {}", id);
        return toResponseWithBatchLoad(saved);
    }
}
