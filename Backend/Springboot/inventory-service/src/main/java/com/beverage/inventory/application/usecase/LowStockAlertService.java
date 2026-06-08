package com.beverage.inventory.application.usecase;

import com.beverage.inventory.domain.model.StockAlertLevel;
import com.beverage.inventory.infrastructure.event.dto.LowStockAlertEvent;
import com.beverage.inventory.infrastructure.persistence.entity.IngredientEntity;
import com.beverage.inventory.infrastructure.persistence.repository.IngredientJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.UUID;

/**
 * Service trung tâm điều phối toàn bộ logic phát hiện và gửi cảnh báo tồn kho thấp.
 *
 * <p><b>Cơ chế dedup (tránh gửi trùng):</b>
 * Mỗi ingredient có trường {@code lowStockAlertSentAt}.
 * <ul>
 *   <li>{@code NULL} → Chưa gửi (hoặc đã restock → reset về NULL) → Cho phép gửi alert mới</li>
 *   <li>{@code != NULL} → Đã gửi rồi → Bỏ qua cho đến khi admin nhập kho</li>
 * </ul>
 *
 * <p><b>Luồng:</b>
 * <ol>
 *   <li>{@link #evaluateAndAlert(UUID, BigDecimal)} được gọi sau mỗi lần {@code deductStock} thành công.</li>
 *   <li>{@link #resetAlertOnRestock(UUID)} được gọi khi admin nhập kho → xóa flag → cho phép gửi alert mới.</li>
 * </ol>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LowStockAlertService {

    private final IngredientJpaRepository ingredientJpaRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${app.kafka.topics.inventory-events}")
    private String inventoryEventsTopicName;

    /**
     * Đánh giá mức độ cảnh báo sau khi trừ kho và publish Kafka event nếu cần.
     *
     * <p>Được gọi trong ngữ cảnh transaction của {@code deductStock}.
     * Dùng REQUIRES_NEW để tách ra: nếu publish Kafka fail thì không rollback kho đã trừ.
     * Thực tế: Kafka publish thường in-memory + async → hiếm fail, nhưng đảm bảo an toàn.
     *
     * @param ingredientId ID nguyên liệu vừa trừ kho
     * @param stockAfter   Tồn kho SAU khi trừ (đã tính sẵn, không cần load DB lại)
     */
    @Transactional(propagation = Propagation.REQUIRED)
    public void evaluateAndAlert(UUID ingredientId, BigDecimal stockAfter) {
        IngredientEntity ingredient = ingredientJpaRepository.findById(ingredientId).orElse(null);
        if (ingredient == null) {
            return;
        }

        StockAlertLevel level = classifyAlertLevel(ingredient, stockAfter);

        if (level == StockAlertLevel.NORMAL) {
            return; // Tồn kho vẫn ổn, không làm gì
        }

        // Kiểm tra dedup: chỉ gửi alert mới nếu level hiện tại nghiêm trọng hơn mức đã gửi gần nhất
        // LOW (ordinal=1) < CRITICAL (ordinal=2) < OUT_OF_STOCK (ordinal=3)
        StockAlertLevel lastLevel = ingredient.getLastAlertLevel();
        if (lastLevel != null && level.ordinal() <= lastLevel.ordinal()) {
            log.debug("Ingredient [{}] đang ở mức [{}] (đã gửi cảnh báo mức [{}] trước đó). Bỏ qua để tránh trùng.",
                    ingredient.getName(), level, lastLevel);
            return;
        }

        // Xử lý đặc biệt cho OUT_OF_STOCK: tự động set isActive = false
        if (level == StockAlertLevel.OUT_OF_STOCK) {
            ingredient.setIsActive(false);
            log.warn("Ingredient [{}] đã hết hàng (stock=0). Tự động set isActive=false.", ingredient.getName());
        }

        // Đánh dấu đã gửi alert và cập nhật mức độ alert gần nhất
        ingredient.setLowStockAlertSentAt(Instant.now());
        ingredient.setLastAlertLevel(level);
        ingredientJpaRepository.save(ingredient);

        // Publish Kafka event → NestJS notification-service
        publishAlert(ingredient, stockAfter, level);
    }

    /**
     * Reset trạng thái alert khi admin nhập kho (restock).
     * Sau khi reset, lần sau xuống thấp ngưỡng sẽ gửi alert mới.
     *
     * @param ingredientId ID nguyên liệu vừa được nhập kho
     */
    @Transactional(propagation = Propagation.REQUIRED)
    public void resetAlertOnRestock(UUID ingredientId) {
        IngredientEntity ingredient = ingredientJpaRepository.findById(ingredientId).orElse(null);
        if (ingredient == null) {
            return;
        }

        if (ingredient.getLowStockAlertSentAt() != null || ingredient.getLastAlertLevel() != null) {
            ingredient.setLowStockAlertSentAt(null);
            ingredient.setLastAlertLevel(null);
            // Nếu trước đó bị set isActive=false do OUT_OF_STOCK, restore lại
            if (Boolean.FALSE.equals(ingredient.getIsActive())) {
                ingredient.setIsActive(true);
                log.info("Ingredient [{}] đã nhập kho trở lại → isActive=true.", ingredient.getName());
            }
            ingredientJpaRepository.save(ingredient);
            log.info("Ingredient [{}]: Reset lowStockAlertSentAt và lastAlertLevel về NULL sau khi nhập kho.", ingredient.getName());
        }
    }

    // ---------------------------------------------------------------
    // Private helpers
    // ---------------------------------------------------------------

    /**
     * Phân loại mức độ cảnh báo dựa vào tồn kho hiện tại và các ngưỡng.
     *
     * <p>Thứ tự kiểm tra: OUT_OF_STOCK → CRITICAL → LOW → NORMAL
     */
    private StockAlertLevel classifyAlertLevel(IngredientEntity ingredient, BigDecimal stockAfter) {
        if (stockAfter.compareTo(BigDecimal.ZERO) <= 0) {
            return StockAlertLevel.OUT_OF_STOCK;
        }

        BigDecimal criticalAbsolute = computeCriticalAbsolute(ingredient);
        if (stockAfter.compareTo(criticalAbsolute) <= 0) {
            return StockAlertLevel.CRITICAL;
        }

        if (stockAfter.compareTo(ingredient.getLowStockThreshold()) <= 0) {
            return StockAlertLevel.LOW;
        }

        return StockAlertLevel.NORMAL;
    }

    /**
     * Tính ngưỡng CRITICAL tuyệt đối từ % đã cài đặt.
     * criticalAbsolute = lowStockThreshold × criticalPct / 100
     */
    private BigDecimal computeCriticalAbsolute(IngredientEntity ingredient) {
        int pct = ingredient.getCriticalStockThresholdPct() != null
                ? ingredient.getCriticalStockThresholdPct() : 5;
        return ingredient.getLowStockThreshold()
                .multiply(BigDecimal.valueOf(pct))
                .divide(BigDecimal.valueOf(100), 3, RoundingMode.HALF_UP);
    }

    /** Publish event tới Kafka → NestJS xử lý IN_APP + email */
    private void publishAlert(IngredientEntity ingredient, BigDecimal stockAfter, StockAlertLevel level) {
        BigDecimal criticalAbsolute = computeCriticalAbsolute(ingredient);
        int pct = ingredient.getCriticalStockThresholdPct() != null ? ingredient.getCriticalStockThresholdPct() : 5;

        LowStockAlertEvent event = LowStockAlertEvent.builder()
                .ingredientId(ingredient.getId())
                .ingredientName(ingredient.getName())
                .unit(ingredient.getUnit())
                .currentStock(stockAfter)
                .lowStockThreshold(ingredient.getLowStockThreshold())
                .criticalAbsolute(criticalAbsolute)
                .criticalPct(pct)
                .alertLevel(level.name())
                .estimatedPortions(-1) // Không tính portions ở đây để tránh N+1, NestJS hiển thị stock thôi
                .occurredAt(Instant.now())
                .build();

        try {
            kafkaTemplate.send(inventoryEventsTopicName, ingredient.getId().toString(), event);
            log.info("Published LOW_STOCK_ALERT [{}] cho ingredient [{}] (stock={}, threshold={}, criticalAbsolute={}).",
                    level, ingredient.getName(), stockAfter, ingredient.getLowStockThreshold(), criticalAbsolute);
        } catch (Exception e) {
            // Log lỗi nhưng không throw — không để Kafka publish failure rollback deductStock
            log.error("Lỗi publish LOW_STOCK_ALERT cho ingredient [{}]: {}. Alert sẽ được gửi lại khi restock.",
                    ingredient.getName(), e.getMessage());
        }
    }
}
