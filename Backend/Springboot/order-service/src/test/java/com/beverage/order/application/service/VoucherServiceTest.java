package com.beverage.order.application.service;

import com.beverage.order.application.dto.response.VoucherValidationResponse;
import com.beverage.order.domain.model.CustomerTier;
import com.beverage.order.infrastructure.persistence.entity.VoucherEntity;
import com.beverage.order.infrastructure.persistence.repository.VoucherJpaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("VoucherService Tests")
class VoucherServiceTest {

    @Mock
    private VoucherJpaRepository voucherRepository;

    @Mock
    private CustomerTierService customerTierService;

    @InjectMocks
    private VoucherService voucherService;

    private VoucherEntity validVoucher;

    @BeforeEach
    void setUp() {
        validVoucher = VoucherEntity.builder()
                .id(UUID.randomUUID())
                .code("TEST10")
                .name("Test 10% Discount")
                .discountType(com.beverage.order.domain.model.VoucherType.PERCENTAGE)
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
    @DisplayName("validateVoucher()")
    class ValidateVoucherTests {

        @Test
        @DisplayName("Should return invalid for null voucher code")
        void shouldReturnInvalidForNullCode() {
            VoucherValidationResponse result = voucherService.validateVoucher(null, new BigDecimal("200000"));

            assertFalse(result.isValid());
            assertEquals("Mã voucher không được để trống", result.getMessage());
        }

        @Test
        @DisplayName("Should return invalid for blank voucher code")
        void shouldReturnInvalidForBlankCode() {
            VoucherValidationResponse result = voucherService.validateVoucher("   ", new BigDecimal("200000"));

            assertFalse(result.isValid());
            assertEquals("Mã voucher không được để trống", result.getMessage());
        }

        @Test
        @DisplayName("Should return invalid for non-existent voucher")
        void shouldReturnInvalidForNonExistentVoucher() {
            when(voucherRepository.findByCode(anyString())).thenReturn(Optional.empty());

            VoucherValidationResponse result = voucherService.validateVoucher("NONEXISTENT", new BigDecimal("200000"));

            assertFalse(result.isValid());
            assertEquals("Mã voucher không tồn tại", result.getMessage());
        }

        @Test
        @DisplayName("Should return invalid for inactive voucher")
        void shouldReturnInvalidForInactiveVoucher() {
            validVoucher.setIsActive(false);
            when(voucherRepository.findByCode("TEST10")).thenReturn(Optional.of(validVoucher));

            VoucherValidationResponse result = voucherService.validateVoucher("TEST10", new BigDecimal("200000"));

            assertFalse(result.isValid());
            assertEquals("Mã voucher đã bị vô hiệu hóa", result.getMessage());
        }

        @Test
        @DisplayName("Should return invalid for voucher not yet valid")
        void shouldReturnInvalidForNotYetValidVoucher() {
            validVoucher.setValidFrom(Instant.now().plus(1, ChronoUnit.DAYS));
            when(voucherRepository.findByCode("TEST10")).thenReturn(Optional.of(validVoucher));

            VoucherValidationResponse result = voucherService.validateVoucher("TEST10", new BigDecimal("200000"));

            assertFalse(result.isValid());
            assertEquals("Mã voucher chưa có hiệu lực", result.getMessage());
        }

        @Test
        @DisplayName("Should return invalid for expired voucher")
        void shouldReturnInvalidForExpiredVoucher() {
            validVoucher.setValidUntil(Instant.now().minus(1, ChronoUnit.DAYS));
            when(voucherRepository.findByCode("TEST10")).thenReturn(Optional.of(validVoucher));

            VoucherValidationResponse result = voucherService.validateVoucher("TEST10", new BigDecimal("200000"));

            assertFalse(result.isValid());
            assertEquals("Mã voucher đã hết hạn", result.getMessage());
        }

        @Test
        @DisplayName("Should return invalid when usage count exhausted")
        void shouldReturnInvalidWhenUsageExhausted() {
            validVoucher.setCurrentUsageCount(10);
            validVoucher.setMaxUsageCount(10);
            when(voucherRepository.findByCode("TEST10")).thenReturn(Optional.of(validVoucher));

            VoucherValidationResponse result = voucherService.validateVoucher("TEST10", new BigDecimal("200000"));

            assertFalse(result.isValid());
            assertEquals("Mã voucher đã hết lượt sử dụng", result.getMessage());
        }

        @Test
        @DisplayName("Should return invalid when order amount below minimum")
        void shouldReturnInvalidWhenBelowMinimum() {
            when(voucherRepository.findByCode("TEST10")).thenReturn(Optional.of(validVoucher));

            VoucherValidationResponse result = voucherService.validateVoucher("TEST10", new BigDecimal("50000"));

            assertFalse(result.isValid());
            assertTrue(result.getMessage().contains("Đơn hàng tối thiểu"));
        }

        @Test
        @DisplayName("Should return valid and calculate discount for valid voucher")
        void shouldReturnValidForValidVoucher() {
            when(voucherRepository.findByCode("TEST10")).thenReturn(Optional.of(validVoucher));
            when(customerTierService.getTier(any())).thenReturn(CustomerTier.GUEST);

            VoucherValidationResponse result = voucherService.validateVoucher("TEST10", new BigDecimal("200000"));

            assertTrue(result.isValid());
            assertEquals("Voucher hợp lệ", result.getMessage());
            assertNotNull(result.getDiscountAmount());
            assertEquals(0, new BigDecimal("20000").compareTo(result.getDiscountAmount()));
        }

        @Test
        @DisplayName("Should return invalid when user tier is too low")
        void shouldReturnInvalidWhenTierTooLow() {
            validVoucher.setApplicableTier("VIP");
            when(voucherRepository.findByCode("TEST10")).thenReturn(Optional.of(validVoucher));
            when(customerTierService.getTier(any())).thenReturn(CustomerTier.MEMBER);

            VoucherValidationResponse result = voucherService.validateVoucher("TEST10", new BigDecimal("200000"));

            assertFalse(result.isValid());
            assertTrue(result.getMessage().contains("chỉ dành cho khách hàng"));
        }
    }

    @Nested
    @DisplayName("calculateDiscount() integration")
    class CalculateDiscountTests {

        @Test
        @DisplayName("Should calculate correct percentage discount")
        void shouldCalculatePercentageCorrectly() {
            validVoucher.setDiscountType(com.beverage.order.domain.model.VoucherType.PERCENTAGE);
            validVoucher.setDiscountValue(new BigDecimal("10")); // 10%
            when(voucherRepository.findByCode("TEST10")).thenReturn(Optional.of(validVoucher));
            when(customerTierService.getTier(any())).thenReturn(CustomerTier.GUEST);

            VoucherValidationResponse result = voucherService.validateVoucher("TEST10", new BigDecimal("300000"));

            assertTrue(result.isValid());
            assertEquals(0, new BigDecimal("30000").compareTo(result.getDiscountAmount()));
        }

        @Test
        @DisplayName("Should cap discount at max discount amount")
        void shouldCapDiscountAtMaximum() {
            validVoucher.setDiscountType(com.beverage.order.domain.model.VoucherType.PERCENTAGE);
            validVoucher.setDiscountValue(new BigDecimal("50")); // 50%
            validVoucher.setMaxDiscountAmount(new BigDecimal("50000")); // max 50k
            when(voucherRepository.findByCode("TEST10")).thenReturn(Optional.of(validVoucher));
            when(customerTierService.getTier(any())).thenReturn(CustomerTier.GUEST);

            VoucherValidationResponse result = voucherService.validateVoucher("TEST10", new BigDecimal("300000"));

            assertTrue(result.isValid());
            assertEquals(0, new BigDecimal("50000").compareTo(result.getDiscountAmount()));
        }

        @Test
        @DisplayName("Should calculate fixed amount discount")
        void shouldCalculateFixedAmount() {
            validVoucher.setDiscountType(com.beverage.order.domain.model.VoucherType.FIXED_AMOUNT);
            validVoucher.setDiscountValue(new BigDecimal("25000"));
            when(voucherRepository.findByCode("TEST10")).thenReturn(Optional.of(validVoucher));
            when(customerTierService.getTier(any())).thenReturn(CustomerTier.GUEST);

            VoucherValidationResponse result = voucherService.validateVoucher("TEST10", new BigDecimal("200000"));

            assertTrue(result.isValid());
            assertEquals(0, new BigDecimal("25000").compareTo(result.getDiscountAmount()));
        }
    }
}
