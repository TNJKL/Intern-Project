package com.beverage.inventory.application.usecase;

import com.beverage.inventory.application.dto.InventoryItemRequest;
import com.beverage.inventory.domain.exception.BusinessException;
import com.beverage.inventory.domain.model.InventoryTransactionType;
import com.beverage.inventory.infrastructure.client.ProductServiceClient;
import com.beverage.inventory.infrastructure.persistence.entity.IngredientEntity;
import com.beverage.inventory.infrastructure.persistence.entity.InventoryTransactionEntity;
import com.beverage.inventory.infrastructure.persistence.entity.RecipeEntity;
import com.beverage.inventory.infrastructure.persistence.entity.RecipeIngredientEntity;
import com.beverage.inventory.infrastructure.persistence.repository.IngredientJpaRepository;
import com.beverage.inventory.infrastructure.persistence.repository.InventoryTransactionJpaRepository;
import com.beverage.inventory.infrastructure.persistence.repository.RecipeIngredientJpaRepository;
import com.beverage.inventory.infrastructure.persistence.repository.RecipeJpaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("InventoryUseCase Tests")
class InventoryUseCaseTest {

    @Mock private IngredientJpaRepository ingredientJpaRepository;
    @Mock private RecipeJpaRepository recipeJpaRepository;
    @Mock private RecipeIngredientJpaRepository recipeIngredientJpaRepository;
    @Mock private InventoryTransactionJpaRepository inventoryTransactionJpaRepository;
    @Mock private ProductServiceClient productServiceClient;
    @Mock private LowStockAlertService lowStockAlertService;

    @InjectMocks
    private InventoryUseCase inventoryUseCase;

    // ==================== Fixtures ====================

    private UUID orderId;
    private UUID productId;
    private UUID variantId;
    private UUID ingredientId;
    private RecipeEntity recipe;
    private RecipeIngredientEntity recipeIngredient;
    private IngredientEntity ingredient;

    @BeforeEach
    void setUp() {
        orderId = UUID.randomUUID();
        productId = UUID.randomUUID();
        variantId = UUID.randomUUID();
        ingredientId = UUID.randomUUID();

        recipe = RecipeEntity.builder()
                .id(UUID.randomUUID())
                .productId(productId)
                .variantId(variantId)
                .productName("Trà sữa test")
                .version((short) 1)
                .isActive(true)
                .build();

        recipeIngredient = RecipeIngredientEntity.builder()
                .id(UUID.randomUUID())
                .recipeId(recipe.getId())
                .ingredientId(ingredientId)
                .quantity(new BigDecimal("10.000")) // 10 units per serving
                .build();

        ingredient = IngredientEntity.builder()
                .id(ingredientId)
                .name("Trà xanh")
                .sku("TRA-XANH-001")
                .unit("gram")
                .currentStock(new BigDecimal("100.000"))
                .lowStockThreshold(new BigDecimal("20.000"))
                .isActive(true)
                .build();
    }

    // ==================== deductStock ====================

    @Nested
    @DisplayName("deductStock()")
    class DeductStockTests {

        @Test
        @DisplayName("Trừ kho thành công cho đơn hàng 1 ly")
        void deductStock_success_singleItem() {
            // Arrange
            InventoryItemRequest item = InventoryItemRequest.builder()
                    .productId(productId)
                    .variantId(variantId)
                    .quantity(1)
                    .build();

            given(recipeJpaRepository.findByProductIdAndVariantId(productId, variantId))
                    .willReturn(Optional.of(recipe));
            given(recipeIngredientJpaRepository.findByRecipeId(recipe.getId()))
                    .willReturn(List.of(recipeIngredient));
            given(ingredientJpaRepository.findById(ingredientId))
                    .willReturn(Optional.of(ingredient));
            given(ingredientJpaRepository.deductStock(ingredientId, new BigDecimal("10.000")))
                    .willReturn(1);
            given(inventoryTransactionJpaRepository.saveAndFlush(any()))
                    .willAnswer(inv -> inv.getArgument(0));

            // Act
            assertThatNoException().isThrownBy(() ->
                    inventoryUseCase.deductStock(orderId, List.of(item)));

            // Assert: đã gọi deductStock với đúng số lượng
            then(ingredientJpaRepository).should().deductStock(ingredientId, new BigDecimal("10.000"));

            // Assert: đã lưu transaction DEDUCT
            ArgumentCaptor<InventoryTransactionEntity> txCaptor =
                    ArgumentCaptor.forClass(InventoryTransactionEntity.class);
            then(inventoryTransactionJpaRepository).should().saveAndFlush(txCaptor.capture());
            InventoryTransactionEntity savedTx = txCaptor.getValue();
            assertThat(savedTx.getTransactionType()).isEqualTo(InventoryTransactionType.DEDUCT);
            assertThat(savedTx.getOrderId()).isEqualTo(orderId);
            assertThat(savedTx.getIngredientId()).isEqualTo(ingredientId);
            assertThat(savedTx.getQuantity()).isEqualByComparingTo(new BigDecimal("10.000"));
        }

        @Test
        @DisplayName("Trừ kho 2 ly → nhân đôi lượng nguyên liệu")
        void deductStock_success_multipleQuantity() {
            // Arrange: order 2 ly
            InventoryItemRequest item = InventoryItemRequest.builder()
                    .productId(productId)
                    .variantId(variantId)
                    .quantity(2)
                    .build();

            given(recipeJpaRepository.findByProductIdAndVariantId(productId, variantId))
                    .willReturn(Optional.of(recipe));
            given(recipeIngredientJpaRepository.findByRecipeId(recipe.getId()))
                    .willReturn(List.of(recipeIngredient));
            given(ingredientJpaRepository.findById(ingredientId))
                    .willReturn(Optional.of(ingredient));
            given(ingredientJpaRepository.deductStock(eq(ingredientId), eq(new BigDecimal("20.000"))))
                    .willReturn(1);
            given(inventoryTransactionJpaRepository.saveAndFlush(any()))
                    .willAnswer(inv -> inv.getArgument(0));

            // Act & Assert
            assertThatNoException().isThrownBy(() ->
                    inventoryUseCase.deductStock(orderId, List.of(item)));

            // 2 ly × 10 = 20 units bị trừ
            then(ingredientJpaRepository).should().deductStock(ingredientId, new BigDecimal("20.000"));
        }

        @Test
        @DisplayName("Tồn kho không đủ → ném BusinessException")
        void deductStock_insufficientStock_throwsException() {
            // Arrange
            InventoryItemRequest item = InventoryItemRequest.builder()
                    .productId(productId)
                    .variantId(variantId)
                    .quantity(1)
                    .build();

            given(recipeJpaRepository.findByProductIdAndVariantId(productId, variantId))
                    .willReturn(Optional.of(recipe));
            given(recipeIngredientJpaRepository.findByRecipeId(recipe.getId()))
                    .willReturn(List.of(recipeIngredient));
            given(ingredientJpaRepository.findById(ingredientId))
                    .willReturn(Optional.of(ingredient));
            // deductStock trả về 0 = DB không update vì WHERE currentStock >= quantity không thỏa
            given(ingredientJpaRepository.deductStock(any(), any())).willReturn(0);

            // Act & Assert
            assertThatThrownBy(() -> inventoryUseCase.deductStock(orderId, List.of(item)))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Khong du? nguyen lieu");

            // Không được lưu transaction khi thất bại
            then(inventoryTransactionJpaRepository).should(never()).saveAndFlush(any());
        }

        @Test
        @DisplayName("Không tìm thấy công thức → ném BusinessException")
        void deductStock_recipeNotFound_throwsException() {
            // Arrange
            InventoryItemRequest item = InventoryItemRequest.builder()
                    .productId(productId)
                    .variantId(variantId)
                    .quantity(1)
                    .build();

            given(recipeJpaRepository.findByProductIdAndVariantId(productId, variantId))
                    .willReturn(Optional.empty());
            given(recipeJpaRepository.findByProductIdAndVariantIdIsNull(productId))
                    .willReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> inventoryUseCase.deductStock(orderId, List.of(item)))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Không tìm thấy công thức");
        }

        @Test
        @DisplayName("quantity <= 0 → bỏ qua item đó, không trừ kho")
        void deductStock_zeroQuantity_skipsItem() {
            // Arrange
            InventoryItemRequest item = InventoryItemRequest.builder()
                    .productId(productId)
                    .variantId(variantId)
                    .quantity(0)
                    .build();

            // Act
            assertThatNoException().isThrownBy(() ->
                    inventoryUseCase.deductStock(orderId, List.of(item)));

            // Không tìm recipe vì item bị skip
            then(recipeJpaRepository).should(never()).findByProductIdAndVariantId(any(), any());
            then(ingredientJpaRepository).should(never()).deductStock(any(), any());
        }
    }

    // ==================== restoreStock ====================

    @Nested
    @DisplayName("restoreStock()")
    class RestoreStockTests {

        @Test
        @DisplayName("Hoàn kho thành công dựa trên DEDUCT transactions")
        void restoreStock_success() {
            // Arrange: có 1 DEDUCT transaction cho đơn này
            InventoryTransactionEntity deductTx = InventoryTransactionEntity.builder()
                    .id(UUID.randomUUID())
                    .orderId(orderId)
                    .ingredientId(ingredientId)
                    .transactionType(InventoryTransactionType.DEDUCT)
                    .quantity(new BigDecimal("10.000"))
                    .quantityBefore(new BigDecimal("100.000"))
                    .quantityAfter(new BigDecimal("90.000"))
                    .build();

            given(inventoryTransactionJpaRepository.findByOrderId(orderId))
                    .willReturn(List.of(deductTx));
            given(ingredientJpaRepository.findById(ingredientId))
                    .willReturn(Optional.of(ingredient));
            given(inventoryTransactionJpaRepository.saveAndFlush(any()))
                    .willAnswer(inv -> inv.getArgument(0));

            // Act
            assertThatNoException().isThrownBy(() ->
                    inventoryUseCase.restoreStock(orderId));

            // Assert: gọi addStock với đúng lượng cần hoàn
            then(ingredientJpaRepository).should().addStock(ingredientId, new BigDecimal("10.000"));

            // Assert: lưu RESTORE transaction
            ArgumentCaptor<InventoryTransactionEntity> txCaptor =
                    ArgumentCaptor.forClass(InventoryTransactionEntity.class);
            then(inventoryTransactionJpaRepository).should().saveAndFlush(txCaptor.capture());
            assertThat(txCaptor.getValue().getTransactionType()).isEqualTo(InventoryTransactionType.RESTORE);
        }

        @Test
        @DisplayName("Đã hoàn kho trước đó → bỏ qua (double-refund prevention)")
        void restoreStock_alreadyRestored_skips() {
            // Arrange: đã có RESTORE transaction cho đơn này
            InventoryTransactionEntity deductTx = InventoryTransactionEntity.builder()
                    .orderId(orderId)
                    .ingredientId(ingredientId)
                    .transactionType(InventoryTransactionType.DEDUCT)
                    .quantity(new BigDecimal("10.000"))
                    .build();
            InventoryTransactionEntity restoreTx = InventoryTransactionEntity.builder()
                    .orderId(orderId)
                    .ingredientId(ingredientId)
                    .transactionType(InventoryTransactionType.RESTORE)
                    .quantity(new BigDecimal("10.000"))
                    .build();

            given(inventoryTransactionJpaRepository.findByOrderId(orderId))
                    .willReturn(List.of(deductTx, restoreTx));

            // Act
            assertThatNoException().isThrownBy(() ->
                    inventoryUseCase.restoreStock(orderId));

            // Assert: KHÔNG gọi addStock vì đã hoàn rồi
            then(ingredientJpaRepository).should(never()).addStock(any(), any());
        }

        @Test
        @DisplayName("Không có DEDUCT transaction → bỏ qua (không ném exception)")
        void restoreStock_noDeductTransactions_skips() {
            // Arrange: đơn chưa bị trừ kho (deductStock chưa chạy)
            given(inventoryTransactionJpaRepository.findByOrderId(orderId))
                    .willReturn(List.of());

            // Act
            assertThatNoException().isThrownBy(() ->
                    inventoryUseCase.restoreStock(orderId));

            // Assert: không gọi addStock
            then(ingredientJpaRepository).should(never()).addStock(any(), any());
        }

        @Test
        @DisplayName("Đã hoàn kho thủ công trước đó → bỏ qua tự động hoàn kho (double-refund prevention)")
        void restoreStock_alreadyManuallyRestored_skips() {
            // Arrange: đã có MANUAL_RESTORE transaction cho đơn này
            InventoryTransactionEntity deductTx = InventoryTransactionEntity.builder()
                    .orderId(orderId)
                    .ingredientId(ingredientId)
                    .transactionType(InventoryTransactionType.DEDUCT)
                    .quantity(new BigDecimal("10.000"))
                    .build();
            InventoryTransactionEntity manualRestoreTx = InventoryTransactionEntity.builder()
                    .orderId(orderId)
                    .ingredientId(ingredientId)
                    .transactionType(InventoryTransactionType.MANUAL_RESTORE)
                    .quantity(new BigDecimal("10.000"))
                    .build();

            given(inventoryTransactionJpaRepository.findByOrderId(orderId))
                    .willReturn(List.of(deductTx, manualRestoreTx));

            // Act
            assertThatNoException().isThrownBy(() ->
                    inventoryUseCase.restoreStock(orderId));

            // Assert: KHÔNG gọi addStock vì đã hoàn rồi
            then(ingredientJpaRepository).should(never()).addStock(any(), any());
        }
    }

    // ==================== manualRestoreStock ====================

    @Nested
    @DisplayName("manualRestoreStock()")
    class ManualRestoreStockTests {

        @Test
        @DisplayName("Hoàn kho thủ công thành công và ghi MANUAL_RESTORE transaction")
        void manualRestoreStock_success() {
            // Arrange
            UUID adminId = UUID.randomUUID();
            String note = "Admin hoàn kho thủ công do Kafka bị đứt kết nối";

            InventoryTransactionEntity deductTx = InventoryTransactionEntity.builder()
                    .id(UUID.randomUUID())
                    .orderId(orderId)
                    .ingredientId(ingredientId)
                    .transactionType(InventoryTransactionType.DEDUCT)
                    .quantity(new BigDecimal("10.000"))
                    .quantityBefore(new BigDecimal("100.000"))
                    .quantityAfter(new BigDecimal("90.000"))
                    .build();

            given(inventoryTransactionJpaRepository.findByOrderId(orderId))
                    .willReturn(List.of(deductTx));
            given(ingredientJpaRepository.findById(ingredientId))
                    .willReturn(Optional.of(ingredient));
            given(inventoryTransactionJpaRepository.saveAndFlush(any()))
                    .willAnswer(inv -> inv.getArgument(0));

            // Act
            assertThatNoException().isThrownBy(() ->
                    inventoryUseCase.manualRestoreStock(orderId, adminId, note));

            // Assert: gọi addStock với đúng lượng cần hoàn
            then(ingredientJpaRepository).should().addStock(ingredientId, new BigDecimal("10.000"));

            // Assert: lưu MANUAL_RESTORE transaction
            ArgumentCaptor<InventoryTransactionEntity> txCaptor =
                    ArgumentCaptor.forClass(InventoryTransactionEntity.class);
            then(inventoryTransactionJpaRepository).should().saveAndFlush(txCaptor.capture());
            InventoryTransactionEntity savedTx = txCaptor.getValue();
            assertThat(savedTx.getTransactionType()).isEqualTo(InventoryTransactionType.MANUAL_RESTORE);
            assertThat(savedTx.getCreatedBy()).isEqualTo(adminId);
            assertThat(savedTx.getNote()).isEqualTo(note);
        }

        @Test
        @DisplayName("Đơn hàng đã được hoàn kho trước đó (qua RESTORE) → ném BusinessException")
        void manualRestoreStock_alreadyRestoredAuto_throwsException() {
            // Arrange: đã có RESTORE transaction cho đơn này
            InventoryTransactionEntity deductTx = InventoryTransactionEntity.builder()
                    .orderId(orderId)
                    .transactionType(InventoryTransactionType.DEDUCT)
                    .build();
            InventoryTransactionEntity restoreTx = InventoryTransactionEntity.builder()
                    .orderId(orderId)
                    .transactionType(InventoryTransactionType.RESTORE)
                    .build();

            given(inventoryTransactionJpaRepository.findByOrderId(orderId))
                    .willReturn(List.of(deductTx, restoreTx));

            // Act & Assert
            assertThatThrownBy(() ->
                    inventoryUseCase.manualRestoreStock(orderId, UUID.randomUUID(), "Lý do"))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("đã được hoàn kho trước đó");

            then(ingredientJpaRepository).should(never()).addStock(any(), any());
        }

        @Test
        @DisplayName("Đơn hàng đã được hoàn kho trước đó (qua MANUAL_RESTORE) → ném BusinessException")
        void manualRestoreStock_alreadyRestoredManually_throwsException() {
            // Arrange: đã có MANUAL_RESTORE transaction cho đơn này
            InventoryTransactionEntity deductTx = InventoryTransactionEntity.builder()
                    .orderId(orderId)
                    .transactionType(InventoryTransactionType.DEDUCT)
                    .build();
            InventoryTransactionEntity manualRestoreTx = InventoryTransactionEntity.builder()
                    .orderId(orderId)
                    .transactionType(InventoryTransactionType.MANUAL_RESTORE)
                    .build();

            given(inventoryTransactionJpaRepository.findByOrderId(orderId))
                    .willReturn(List.of(deductTx, manualRestoreTx));

            // Act & Assert
            assertThatThrownBy(() ->
                    inventoryUseCase.manualRestoreStock(orderId, UUID.randomUUID(), "Lý do"))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("đã được hoàn kho trước đó");

            then(ingredientJpaRepository).should(never()).addStock(any(), any());
        }

        @Test
        @DisplayName("Không có DEDUCT transaction → ném BusinessException")
        void manualRestoreStock_noDeductTransactions_throwsException() {
            // Arrange: đơn chưa bị trừ kho
            given(inventoryTransactionJpaRepository.findByOrderId(orderId))
                    .willReturn(List.of());

            // Act & Assert
            assertThatThrownBy(() ->
                    inventoryUseCase.manualRestoreStock(orderId, UUID.randomUUID(), "Lý do"))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Không tìm thấy lịch sử trừ kho");

            then(ingredientJpaRepository).should(never()).addStock(any(), any());
        }
    }

    // ==================== validateStockAvailability ====================

    @Nested
    @DisplayName("validateStockAvailability()")
    class ValidateStockTests {

        @Test
        @DisplayName("Tồn kho đủ → không ném exception")
        void validateStock_sufficient_passes() {
            // Arrange: stock 100, cần 10
            InventoryItemRequest item = InventoryItemRequest.builder()
                    .productId(productId)
                    .variantId(variantId)
                    .quantity(1)
                    .build();

            given(recipeJpaRepository.findByProductIdAndVariantId(productId, variantId))
                    .willReturn(Optional.of(recipe));
            given(recipeIngredientJpaRepository.findByRecipeId(recipe.getId()))
                    .willReturn(List.of(recipeIngredient));
            given(ingredientJpaRepository.findById(ingredientId))
                    .willReturn(Optional.of(ingredient)); // stock = 100, cần 10 → đủ

            // Act & Assert
            assertThatNoException().isThrownBy(() ->
                    inventoryUseCase.validateStockAvailability(List.of(item)));
        }

        @Test
        @DisplayName("Tồn kho không đủ → ném BusinessException với tên nguyên liệu")
        void validateStock_insufficient_throwsWithIngredientName() {
            // Arrange: stock chỉ có 5, cần 10
            IngredientEntity lowStockIngredient = IngredientEntity.builder()
                    .id(ingredientId)
                    .name("Trà xanh")
                    .currentStock(new BigDecimal("5.000"))
                    .isActive(true)
                    .build();

            InventoryItemRequest item = InventoryItemRequest.builder()
                    .productId(productId)
                    .variantId(variantId)
                    .quantity(1)
                    .build();

            given(recipeJpaRepository.findByProductIdAndVariantId(productId, variantId))
                    .willReturn(Optional.of(recipe));
            given(recipeIngredientJpaRepository.findByRecipeId(recipe.getId()))
                    .willReturn(List.of(recipeIngredient));
            given(ingredientJpaRepository.findById(ingredientId))
                    .willReturn(Optional.of(lowStockIngredient));

            // Act & Assert
            assertThatThrownBy(() ->
                    inventoryUseCase.validateStockAvailability(List.of(item)))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Trà xanh");
        }

        @Test
        @DisplayName("Nguyên liệu không hoạt động (isActive=false) → ném BusinessException")
        void validateStock_inactiveIngredient_throwsException() {
            // Arrange
            IngredientEntity inactiveIngredient = IngredientEntity.builder()
                    .id(ingredientId)
                    .name("Nguyên liệu ngừng dùng")
                    .currentStock(new BigDecimal("999.000"))
                    .isActive(false) // inactive!
                    .build();

            InventoryItemRequest item = InventoryItemRequest.builder()
                    .productId(productId)
                    .variantId(variantId)
                    .quantity(1)
                    .build();

            given(recipeJpaRepository.findByProductIdAndVariantId(productId, variantId))
                    .willReturn(Optional.of(recipe));
            given(recipeIngredientJpaRepository.findByRecipeId(recipe.getId()))
                    .willReturn(List.of(recipeIngredient));
            given(ingredientJpaRepository.findById(ingredientId))
                    .willReturn(Optional.of(inactiveIngredient));

            // Act & Assert
            assertThatThrownBy(() ->
                    inventoryUseCase.validateStockAvailability(List.of(item)))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("ngung` hoat. dong.");
        }

        @Test
        @DisplayName("Tồn kho vừa đúng bằng nhu cầu → hợp lệ (edge case)")
        void validateStock_exactMatch_passes() {
            // Arrange: stock đúng bằng 10 (1 ly × 10 units/ly)
            IngredientEntity exactStockIngredient = IngredientEntity.builder()
                    .id(ingredientId)
                    .name("Trà xanh")
                    .currentStock(new BigDecimal("10.000"))
                    .isActive(true)
                    .build();

            InventoryItemRequest item = InventoryItemRequest.builder()
                    .productId(productId)
                    .variantId(variantId)
                    .quantity(1)
                    .build();

            given(recipeJpaRepository.findByProductIdAndVariantId(productId, variantId))
                    .willReturn(Optional.of(recipe));
            given(recipeIngredientJpaRepository.findByRecipeId(recipe.getId()))
                    .willReturn(List.of(recipeIngredient));
            given(ingredientJpaRepository.findById(ingredientId))
                    .willReturn(Optional.of(exactStockIngredient));

            // Act & Assert: stock == cần → vẫn hợp lệ (compareTo == 0, không < 0)
            assertThatNoException().isThrownBy(() ->
                    inventoryUseCase.validateStockAvailability(List.of(item)));
        }
    }

    // ==================== calculateMaxPortions ====================

    @Nested
    @DisplayName("calculateMaxPortions()")
    class CalculateMaxPortionsTests {

        @Test
        @DisplayName("Tính đúng số ly tối đa từ tồn kho")
        void calculateMaxPortions_success() {
            // Arrange: stock 100, mỗi ly cần 10 → tối đa 10 ly
            given(recipeJpaRepository.findByProductIdAndVariantId(productId, variantId))
                    .willReturn(Optional.of(recipe));
            given(recipeIngredientJpaRepository.findByRecipeId(recipe.getId()))
                    .willReturn(List.of(recipeIngredient));
            given(ingredientJpaRepository.findById(ingredientId))
                    .willReturn(Optional.of(ingredient));

            // Act
            int result = inventoryUseCase.calculateMaxPortions(productId, variantId);

            // Assert
            assertThat(result).isEqualTo(10);
        }

        @Test
        @DisplayName("Không có công thức → trả về 0")
        void calculateMaxPortions_noRecipe_returnsZero() {
            given(recipeJpaRepository.findByProductIdAndVariantId(productId, variantId))
                    .willReturn(Optional.empty());
            given(recipeJpaRepository.findByProductIdAndVariantIdIsNull(productId))
                    .willReturn(Optional.empty());

            int result = inventoryUseCase.calculateMaxPortions(productId, variantId);

            assertThat(result).isZero();
        }

        @Test
        @DisplayName("Tồn kho = 0 → trả về 0 ly")
        void calculateMaxPortions_zeroStock_returnsZero() {
            IngredientEntity emptyStock = IngredientEntity.builder()
                    .id(ingredientId)
                    .currentStock(BigDecimal.ZERO)
                    .isActive(true)
                    .build();

            given(recipeJpaRepository.findByProductIdAndVariantId(productId, variantId))
                    .willReturn(Optional.of(recipe));
            given(recipeIngredientJpaRepository.findByRecipeId(recipe.getId()))
                    .willReturn(List.of(recipeIngredient));
            given(ingredientJpaRepository.findById(ingredientId))
                    .willReturn(Optional.of(emptyStock));

            int result = inventoryUseCase.calculateMaxPortions(productId, variantId);

            assertThat(result).isZero();
        }
    }
}
