package com.beverage.order.domain.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("CustomerTier Tests")
class CustomerTierTest {

    @Nested
    @DisplayName("canUseVoucherTier()")
    class CanUseVoucherTierTests {

        @ParameterizedTest(name = "{0} can use voucher tier {1}: {2}")
        @CsvSource({
            "GUEST, ALL, true",
            "GUEST, GUEST, true",
            "GUEST, MEMBER, false",
            "GUEST, VIP, false",
            "MEMBER, ALL, true",
            "MEMBER, GUEST, true",
            "MEMBER, MEMBER, true",
            "MEMBER, VIP, false",
            "VIP, ALL, true",
            "VIP, GUEST, true",
            "VIP, MEMBER, true",
            "VIP, VIP, true"
        })
        void shouldCheckVoucherTierAccess(CustomerTier userTier, String voucherTier, boolean expected) {
            assertEquals(expected, userTier.canUseVoucherTier(voucherTier));
        }

        @Test
        @DisplayName("GUEST can always use null voucher tier")
        void guestCanUseNullTier() {
            assertTrue(CustomerTier.GUEST.canUseVoucherTier(null));
        }

        @Test
        @DisplayName("Should return false for invalid voucher tier string")
        void shouldReturnFalseForInvalidTier() {
            assertFalse(CustomerTier.GUEST.canUseVoucherTier("INVALID_TIER"));
        }
    }

    @Nested
    @DisplayName("calculateTier()")
    class CalculateTierTests {

        @Test
        @DisplayName("Should return VIP when totalSpent >= 3,000,000")
        void shouldReturnVipWhenSpentEnough() {
            CustomerTier tier = CustomerTier.calculateTier(new BigDecimal("3000000"), 0);
            assertEquals(CustomerTier.VIP, tier);
        }

        @Test
        @DisplayName("Should return VIP when totalOrders >= 20")
        void shouldReturnVipWhenManyOrders() {
            CustomerTier tier = CustomerTier.calculateTier(BigDecimal.ZERO, 20);
            assertEquals(CustomerTier.VIP, tier);
        }

        @Test
        @DisplayName("Should return MEMBER when totalSpent >= 500,000")
        void shouldReturnMemberWhenSpentEnough() {
            CustomerTier tier = CustomerTier.calculateTier(new BigDecimal("500000"), 0);
            assertEquals(CustomerTier.MEMBER, tier);
        }

        @Test
        @DisplayName("Should return MEMBER when totalOrders >= 5")
        void shouldReturnMemberWhenManyOrders() {
            CustomerTier tier = CustomerTier.calculateTier(BigDecimal.ZERO, 5);
            assertEquals(CustomerTier.MEMBER, tier);
        }

        @Test
        @DisplayName("Should return GUEST when below thresholds")
        void shouldReturnGuestWhenBelowThresholds() {
            CustomerTier tier = CustomerTier.calculateTier(new BigDecimal("100000"), 2);
            assertEquals(CustomerTier.GUEST, tier);
        }

        @Test
        @DisplayName("Should handle null totalSpent as zero")
        void shouldHandleNullTotalSpent() {
            CustomerTier tier = CustomerTier.calculateTier(null, 0);
            assertEquals(CustomerTier.GUEST, tier);
        }
    }

    @Nested
    @DisplayName("getDisplayName()")
    class GetDisplayNameTests {

        @Test
        @DisplayName("Should return correct display names")
        void shouldReturnCorrectDisplayNames() {
            assertEquals("Khách vãng lai", CustomerTier.GUEST.getDisplayName());
            assertEquals("Khách hàng thân thiết", CustomerTier.MEMBER.getDisplayName());
            assertEquals("Khách VIP", CustomerTier.VIP.getDisplayName());
        }
    }
}
