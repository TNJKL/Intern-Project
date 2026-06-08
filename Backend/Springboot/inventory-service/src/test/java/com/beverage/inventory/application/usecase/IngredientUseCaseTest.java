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
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("IngredientUseCase Tests")
class IngredientUseCaseTest {

    @Mock private IngredientJpaRepository ingredientJpaRepository;
    @Mock private InventoryTransactionJpaRepository inventoryTransactionJpaRepository;

    @InjectMocks
    private IngredientUseCase ingredientUseCase;

    private UUID ingredientId;
    private IngredientEntity existingIngredient;

    @BeforeEach
    void setUp() {
        ingredientId = UUID.randomUUID();
        existingIngredient = IngredientEntity.builder()
                .id(ingredientId)
                .name("Trà xanh")
                .sku("TRA-XANH-001")
                .unit("gram")
                .currentStock(new BigDecimal("100.000"))
                .lowStockThreshold(new BigDecimal("20.000"))
                .costPerUnit(new BigDecimal("500.00"))
                .isActive(true)
                .build();
    }

    // ==================== createIngredient ====================

    @Nested
    @DisplayName("createIngredient()")
    class CreateIngredientTests {

        @Test
        @DisplayName("Tạo nguyên liệu mới thành công")
        void create_success() {
            // Arrange
            CreateIngredientRequest request = CreateIngredientRequest.builder()
                    .name("Sữa tươi")
                    .sku("SUA-TUOI-001")
                    .unit("ml")
                    .currentStock(new BigDecimal("500.000"))
                    .lowStockThreshold(new BigDecimal("50.000"))
                    .costPerUnit(new BigDecimal("200.00"))
                    .build();

            given(ingredientJpaRepository.existsBySku("SUA-TUOI-001")).willReturn(false);
            given(ingredientJpaRepository.save(any(IngredientEntity.class)))
                    .willAnswer(inv -> inv.getArgument(0));

            // Act
            IngredientResponse response = ingredientUseCase.createIngredient(request);

            // Assert
            assertThat(response.getName()).isEqualTo("Sữa tươi");
            assertThat(response.getSku()).isEqualTo("SUA-TUOI-001");
            then(ingredientJpaRepository).should().save(any(IngredientEntity.class));
        }

        @Test
        @DisplayName("SKU đã tồn tại → ném BusinessException")
        void create_duplicateSku_throwsException() {
            // Arrange
            CreateIngredientRequest request = CreateIngredientRequest.builder()
                    .name("Trà xanh khác")
                    .sku("TRA-XANH-001") // SKU đã có
                    .unit("gram")
                    .currentStock(BigDecimal.ZERO)
                    .lowStockThreshold(BigDecimal.ZERO)
                    .costPerUnit(BigDecimal.ZERO)
                    .build();

            given(ingredientJpaRepository.existsBySku("TRA-XANH-001")).willReturn(true);

            // Act & Assert
            assertThatThrownBy(() -> ingredientUseCase.createIngredient(request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("TRA-XANH-001");

            then(ingredientJpaRepository).should(never()).save(any());
        }
    }

    // ==================== updateIngredient ====================

    @Nested
    @DisplayName("updateIngredient()")
    class UpdateIngredientTests {

        @Test
        @DisplayName("Cập nhật tên nguyên liệu thành công")
        void update_name_success() {
            // Arrange
            UpdateIngredientRequest request = UpdateIngredientRequest.builder()
                    .name("Trà xanh Thái Lan")
                    .build();

            given(ingredientJpaRepository.findById(ingredientId))
                    .willReturn(Optional.of(existingIngredient));
            given(ingredientJpaRepository.save(any(IngredientEntity.class)))
                    .willAnswer(inv -> inv.getArgument(0));

            // Act
            IngredientResponse response = ingredientUseCase.updateIngredient(ingredientId, request);

            // Assert
            assertThat(response.getName()).isEqualTo("Trà xanh Thái Lan");
        }

        @Test
        @DisplayName("Đổi SKU sang SKU đã dùng bởi nguyên liệu khác → ném BusinessException")
        void update_duplicateSku_throwsException() {
            // Arrange: đổi SKU sang "SUA-001" nhưng SKU đó thuộc về nguyên liệu khác
            UUID otherId = UUID.randomUUID();
            IngredientEntity other = IngredientEntity.builder()
                    .id(otherId)
                    .sku("SUA-001")
                    .build();

            UpdateIngredientRequest request = UpdateIngredientRequest.builder()
                    .sku("SUA-001")
                    .build();

            given(ingredientJpaRepository.findById(ingredientId))
                    .willReturn(Optional.of(existingIngredient));
            given(ingredientJpaRepository.findBySku("SUA-001"))
                    .willReturn(Optional.of(other)); // thuộc về otherId, không phải ingredientId

            // Act & Assert
            assertThatThrownBy(() -> ingredientUseCase.updateIngredient(ingredientId, request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("SUA-001");
        }

        @Test
        @DisplayName("Đổi SKU sang SKU cùng nguyên liệu (không thay đổi) → cho phép")
        void update_sameSku_allowed() {
            // Arrange: request SKU giống SKU hiện tại (equalsIgnoreCase)
            UpdateIngredientRequest request = UpdateIngredientRequest.builder()
                    .sku("TRA-XANH-001") // same SKU
                    .build();

            given(ingredientJpaRepository.findById(ingredientId))
                    .willReturn(Optional.of(existingIngredient));
            given(ingredientJpaRepository.save(any()))
                    .willAnswer(inv -> inv.getArgument(0));

            // Act & Assert: không ném exception
            assertThatNoException().isThrownBy(() ->
                    ingredientUseCase.updateIngredient(ingredientId, request));

            // findBySku không cần gọi vì SKU giống nhau
            then(ingredientJpaRepository).should(never()).findBySku(any());
        }

        @Test
        @DisplayName("Không tìm thấy nguyên liệu → ném BusinessException")
        void update_notFound_throwsException() {
            given(ingredientJpaRepository.findById(ingredientId)).willReturn(Optional.empty());

            assertThatThrownBy(() ->
                    ingredientUseCase.updateIngredient(ingredientId, new UpdateIngredientRequest()))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining(ingredientId.toString());
        }
    }

    // ==================== deleteIngredient / restoreIngredient ====================

    @Nested
    @DisplayName("deleteIngredient() & restoreIngredient()")
    class SoftDeleteTests {

        @Test
        @DisplayName("Xóa mềm → isActive = false")
        void delete_setsInactiveFalse() {
            given(ingredientJpaRepository.findById(ingredientId))
                    .willReturn(Optional.of(existingIngredient));
            given(ingredientJpaRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

            ingredientUseCase.deleteIngredient(ingredientId);

            ArgumentCaptor<IngredientEntity> captor = ArgumentCaptor.forClass(IngredientEntity.class);
            then(ingredientJpaRepository).should().save(captor.capture());
            assertThat(captor.getValue().getIsActive()).isFalse();
        }

        @Test
        @DisplayName("Khôi phục → isActive = true")
        void restore_setsActiveTrue() {
            existingIngredient.setIsActive(false);
            given(ingredientJpaRepository.findById(ingredientId))
                    .willReturn(Optional.of(existingIngredient));
            given(ingredientJpaRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

            IngredientResponse response = ingredientUseCase.restoreIngredient(ingredientId);

            assertThat(response.getIsActive()).isTrue();
        }
    }

    // ==================== restockIngredient ====================

    @Nested
    @DisplayName("restockIngredient()")
    class RestockTests {

        @Test
        @DisplayName("Nhập kho thành công và ghi RESTOCK transaction")
        void restock_success() {
            // Arrange
            RestockRequest request = RestockRequest.builder()
                    .quantity(new BigDecimal("50.000"))
                    .note("Nhập hàng tuần")
                    .build();

            given(ingredientJpaRepository.findById(ingredientId))
                    .willReturn(Optional.of(existingIngredient));
            given(ingredientJpaRepository.addStock(ingredientId, new BigDecimal("50.000")))
                    .willReturn(1);
            // Lần 2 findById sau addStock → trả về entity đã cập nhật
            IngredientEntity updated = IngredientEntity.builder()
                    .id(ingredientId)
                    .name("Trà xanh")
                    .sku("TRA-XANH-001")
                    .unit("gram")
                    .currentStock(new BigDecimal("150.000")) // 100 + 50
                    .lowStockThreshold(new BigDecimal("20.000"))
                    .costPerUnit(new BigDecimal("500.00"))
                    .isActive(true)
                    .build();
            given(ingredientJpaRepository.findById(ingredientId))
                    .willReturn(Optional.of(existingIngredient))  // first call
                    .willReturn(Optional.of(updated));            // second call after addStock
            given(inventoryTransactionJpaRepository.saveAndFlush(any()))
                    .willAnswer(inv -> inv.getArgument(0));

            // Act
            IngredientResponse response = ingredientUseCase.restockIngredient(ingredientId, request);

            // Assert stock updated
            assertThat(response.getCurrentStock()).isEqualByComparingTo(new BigDecimal("150.000"));

            // Assert RESTOCK transaction saved
            ArgumentCaptor<InventoryTransactionEntity> txCaptor =
                    ArgumentCaptor.forClass(InventoryTransactionEntity.class);
            then(inventoryTransactionJpaRepository).should().saveAndFlush(txCaptor.capture());
            InventoryTransactionEntity tx = txCaptor.getValue();
            assertThat(tx.getTransactionType()).isEqualTo(InventoryTransactionType.RESTOCK);
            assertThat(tx.getQuantity()).isEqualByComparingTo(new BigDecimal("50.000"));
            assertThat(tx.getNote()).isEqualTo("Nhập hàng tuần");
        }

        @Test
        @DisplayName("Không tìm thấy nguyên liệu → ném BusinessException")
        void restock_notFound_throwsException() {
            given(ingredientJpaRepository.findById(ingredientId)).willReturn(Optional.empty());

            assertThatThrownBy(() ->
                    ingredientUseCase.restockIngredient(ingredientId,
                            RestockRequest.builder().quantity(BigDecimal.TEN).build()))
                    .isInstanceOf(BusinessException.class);
        }
    }
}
