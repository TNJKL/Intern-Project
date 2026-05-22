package com.beverage.order.domain.model;

import com.beverage.order.infrastructure.persistence.entity.VoucherEntity;
import com.beverage.order.domain.model.VoucherType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("VoucherEntity Tests")
class VoucherEntityTest {

    private VoucherEntity createValidVoucher() {
        return VoucherEntity.builder()
                .id(UUID.randomUUID())
                .code("TEST10")
                .name("Test Voucher")
                .discountType(VoucherType.PERCENTAGE)
                .discountValue(new BigDecimal("10"))
                .minOrderAmount(new BigDecimal("100000"))
                .maxUsageCount(10)
                .currentUsageCount(0)
                .validFrom(Instant.now().minus(1, ChronoUnit.DAYS))
                .validUntil(Instant.now().plus(30, ChronoUnit.DAYS))
                .isActive(true)
                .applicableTier("ALL")
                .build();
    }

    @Nested
    @DisplayName("isValid()")
    class IsValidTests {

        @Test
        @DisplayName("Should return true for valid active voucher")
        void shouldReturnTrueForValidVoucher() {
            VoucherEntity voucher = createValidVoucher();
            assertTrue(voucher.isValid());
        }

        @Test
        @DisplayName("Should return false when voucher is inactive")
        void shouldReturnFalseWhenInactive() {
            VoucherEntity voucher = createValidVoucher();
            voucher.setIsActive(false);
            assertFalse(voucher.isValid());
        }

        @Test
        @DisplayName("Should return false when voucher is not yet valid")
        void shouldReturnFalseWhenNotYetValid() {
            VoucherEntity voucher = createValidVoucher();
            voucher.setValidFrom(Instant.now().plus(1, ChronoUnit.DAYS));
            assertFalse(voucher.isValid());
        }

        @Test
        @DisplayName("Should return false when voucher is expired")
        void shouldReturnFalseWhenExpired() {
            VoucherEntity voucher = createValidVoucher();
            voucher.setValidUntil(Instant.now().minus(1, ChronoUnit.DAYS));
            assertFalse(voucher.isValid());
        }

        @Test
        @DisplayName("Should return false when max usage count is reached")
        void shouldReturnFalseWhenMaxUsageReached() {
            VoucherEntity voucher = createValidVoucher();
            voucher.setCurrentUsageCount(10);
            voucher.setMaxUsageCount(10);
            assertFalse(voucher.isValid());
        }

        @Test
        @DisplayName("Should return true when max usage count is unlimited (null)")
        void shouldReturnTrueWhenMaxUsageIsNull() {
            VoucherEntity voucher = createValidVoucher();
            voucher.setMaxUsageCount(null);
            assertTrue(voucher.isValid());
        }
    }

    @Nested
    @DisplayName("canApply()")
    class CanApplyTests {

        @Test
        @DisplayName("Should return true when order amount meets minimum")
        void shouldReturnTrueWhenMeetsMinimum() {
            VoucherEntity voucher = createValidVoucher();
            assertTrue(voucher.canApply(new BigDecimal("100000")));
            assertTrue(voucher.canApply(new BigDecimal("200000")));
        }

        @Test
        @DisplayName("Should return false when order amount is below minimum")
        void shouldReturnFalseWhenBelowMinimum() {
            VoucherEntity voucher = createValidVoucher();
            assertFalse(voucher.canApply(new BigDecimal("50000")));
        }

        @Test
        @DisplayName("Should return false when voucher is invalid regardless of amount")
        void shouldReturnFalseWhenVoucherInvalid() {
            VoucherEntity voucher = createValidVoucher();
            voucher.setIsActive(false);
            assertFalse(voucher.canApply(new BigDecimal("1000000")));
        }
    }

    @Nested
    @DisplayName("calculateDiscount()")
    class CalculateDiscountTests {

        @Test
        @DisplayName("Should calculate percentage discount correctly")
        void shouldCalculatePercentageDiscount() {
            VoucherEntity voucher = createValidVoucher();
            voucher.setDiscountType(VoucherType.PERCENTAGE);
            voucher.setDiscountValue(new BigDecimal("10")); // 10%

            BigDecimal discount = voucher.calculateDiscount(new BigDecimal("200000"));
            assertEquals(new BigDecimal("20000"), discount);
        }

        @Test
        @DisplayName("Should cap percentage discount at max discount amount")
        void shouldCapPercentageDiscount() {
            VoucherEntity voucher = createValidVoucher();
            voucher.setDiscountType(VoucherType.PERCENTAGE);
            voucher.setDiscountValue(new BigDecimal("50")); // 50%
            voucher.setMaxDiscountAmount(new BigDecimal("50000"));

            BigDecimal discount = voucher.calculateDiscount(new BigDecimal("200000"));
            assertEquals(new BigDecimal("50000"), discount);
        }

        @Test
        @DisplayName("Should return fixed amount discount correctly")
        void shouldReturnFixedDiscount() {
            VoucherEntity voucher = createValidVoucher();
            voucher.setDiscountType(VoucherType.FIXED_AMOUNT);
            voucher.setDiscountValue(new BigDecimal("30000"));

            BigDecimal discount = voucher.calculateDiscount(new BigDecimal("200000"));
            assertEquals(new BigDecimal("30000"), discount);
        }

        @Test
        @DisplayName("Should cap fixed discount at order amount")
        void shouldCapFixedDiscountAtOrderAmount() {
            VoucherEntity voucher = createValidVoucher();
            voucher.setDiscountType(VoucherType.FIXED_AMOUNT);
            voucher.setDiscountValue(new BigDecimal("50000"));

            BigDecimal discount = voucher.calculateDiscount(new BigDecimal("30000"));
            assertEquals(new BigDecimal("30000"), discount); // capped at order amount
        }

        @ParameterizedTest(name = "Order {0} with discount {1} should give result {2}")
        @CsvSource({
            "100000, 10, 10000",   // 10% of 100000
            "500000, 5, 25000",    // 5% of 500000
            "1000000, 15, 150000"  // 15% of 1000000
        })
        @DisplayName("Percentage discount calculation")
        void shouldCalculateVariousPercentages(String orderAmount, String discountPercent, String expected) {
            VoucherEntity voucher = createValidVoucher();
            voucher.setDiscountType(VoucherType.PERCENTAGE);
            voucher.setDiscountValue(new BigDecimal(discountPercent));

            BigDecimal discount = voucher.calculateDiscount(new BigDecimal(orderAmount));
            assertEquals(new BigDecimal(expected), discount);
        }
    }

    @Nested
    @DisplayName("incrementUsage()")
    class IncrementUsageTests {

        @Test
        @DisplayName("Should increment current usage count")
        void shouldIncrementUsageCount() {
            VoucherEntity voucher = createValidVoucher();
            voucher.setCurrentUsageCount(5);

            voucher.incrementUsage();

            assertEquals(6, voucher.getCurrentUsageCount());
        }

        @Test
        @DisplayName("Should handle null current usage count")
        void shouldHandleNullUsageCount() {
            VoucherEntity voucher = createValidVoucher();
            voucher.setCurrentUsageCount(null);

            voucher.incrementUsage();

            assertEquals(1, voucher.getCurrentUsageCount());
        }
    }
}
