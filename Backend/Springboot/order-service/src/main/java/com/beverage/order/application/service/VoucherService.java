package com.beverage.order.application.service;

import com.beverage.order.application.dto.request.CreateVoucherRequest;
import com.beverage.order.application.dto.request.UpdateVoucherRequest;
import com.beverage.order.application.dto.response.VoucherResponse;
import com.beverage.order.application.dto.response.VoucherValidationResponse;
import com.beverage.order.domain.exception.BusinessException;
import com.beverage.order.domain.exception.ResourceNotFoundException;
import com.beverage.order.domain.model.CustomerTier;
import com.beverage.order.infrastructure.persistence.entity.VoucherEntity;
import com.beverage.order.infrastructure.persistence.repository.VoucherJpaRepository;
import com.beverage.order.infrastructure.persistence.repository.VoucherUsageJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;
import java.math.BigDecimal;
import java.time.Instant;

@Service
@RequiredArgsConstructor
@Slf4j
public class VoucherService {

    private final VoucherJpaRepository voucherRepository;
    private final CustomerTierService customerTierService;
    private final VoucherUsageJpaRepository voucherUsageRepository;

    @Transactional(readOnly = true)
    public VoucherValidationResponse validateVoucher(String code, BigDecimal orderAmount) {
        return validateVoucher(code, orderAmount, null, null);
    }

    @Transactional(readOnly = true)
    public VoucherValidationResponse validateVoucher(String code, BigDecimal orderAmount, UUID userId) {
        return validateVoucher(code, orderAmount, userId, null);
    }

    @Transactional(readOnly = true)
    public VoucherValidationResponse validateVoucher(String code, BigDecimal orderAmount, UUID userId, String userEmail) {
        if (code == null || code.isBlank()) {
            return VoucherValidationResponse.builder()
                    .valid(false)
                    .message("Mã voucher không được để trống")
                    .build();
        }

        VoucherEntity voucher = voucherRepository.findByCode(code.trim().toUpperCase())
                .orElse(null);

        if (voucher == null) {
            return VoucherValidationResponse.builder()
                    .valid(false)
                    .code(code)
                    .message("Mã voucher không tồn tại")
                    .build();
        }

        Instant now = Instant.now();
        if (!Boolean.TRUE.equals(voucher.getIsActive())) {
            return VoucherValidationResponse.builder()
                    .valid(false)
                    .code(code)
                    .message("Mã voucher đã bị vô hiệu hóa")
                    .build();
        }

        if (voucher.getValidFrom() != null && now.isBefore(voucher.getValidFrom())) {
            return VoucherValidationResponse.builder()
                    .valid(false)
                    .code(code)
                    .message("Mã voucher chưa có hiệu lực")
                    .build();
        }

        if (voucher.getValidUntil() != null && now.isAfter(voucher.getValidUntil())) {
            return VoucherValidationResponse.builder()
                    .valid(false)
                    .code(code)
                    .message("Mã voucher đã hết hạn")
                    .build();
        }

        if (voucher.getMaxUsageCount() != null && voucher.getCurrentUsageCount() >= voucher.getMaxUsageCount()) {
            return VoucherValidationResponse.builder()
                    .valid(false)
                    .code(code)
                    .message("Mã voucher đã hết lượt sử dụng")
                    .build();
        }

        if (voucher.getMaxUsagePerUser() != null) {
            long usedCount = voucherUsageRepository.countByVoucherIdAndUser(voucher.getId(), userId, userEmail);
            if (usedCount >= voucher.getMaxUsagePerUser()) {
                return VoucherValidationResponse.builder()
                        .valid(false)
                        .code(code)
                        .message("Bạn đã sử dụng tối đa lượt cho phép của voucher này")
                        .build();
            }
        }

        if (orderAmount != null && orderAmount.compareTo(voucher.getMinOrderAmount()) < 0) {
            return VoucherValidationResponse.builder()
                    .valid(false)
                    .code(code)
                    .message("Đơn hàng tối thiểu " + voucher.getMinOrderAmount() + "đ để áp dụng mã này")
                    .build();
        }

        CustomerTier userTier = customerTierService.getTier(userId);
        String applicableTier = voucher.getApplicableTier();
        if (!userTier.canUseVoucherTier(applicableTier)) {
            return VoucherValidationResponse.builder()
                    .valid(false)
                    .code(code)
                    .message("Voucher này chỉ dành cho khách hàng " + applicableTier + " trở lên. Hạng của bạn: " + userTier.name())
                    .build();
        }

        BigDecimal discount = BigDecimal.ZERO;
        if (orderAmount != null) {
            discount = voucher.calculateDiscount(orderAmount);
        }

        return VoucherValidationResponse.builder()
                .valid(true)
                .code(code)
                .message("Voucher hợp lệ")
                .discountAmount(discount)
                .build();
    }

    @Transactional(readOnly = true)
    public VoucherValidationResponse validateAndApplyVoucher(String code, BigDecimal subtotal) {
        return validateAndApplyVoucher(code, subtotal, null, null);
    }

    @Transactional(readOnly = true)
    public VoucherValidationResponse validateAndApplyVoucher(String code, BigDecimal subtotal, UUID userId) {
        return validateAndApplyVoucher(code, subtotal, userId, null);
    }

    @Transactional(readOnly = true)
    public VoucherValidationResponse validateAndApplyVoucher(String code, BigDecimal subtotal, UUID userId, String userEmail) {
        VoucherValidationResponse validation = validateVoucher(code, subtotal, userId, userEmail);

        if (!validation.isValid()) {
            throw new BusinessException(validation.getMessage());
        }

        var voucher = voucherRepository.findByCode(code.trim().toUpperCase())
                .orElseThrow(() -> new BusinessException("Mã voucher không tồn tại"));

        BigDecimal discount = voucher.calculateDiscount(subtotal);

        return VoucherValidationResponse.builder()
                .valid(true)
                .code(code)
                .message("Voucher được áp dụng thành công")
                .discountAmount(discount)
                .build();
    }

    @Transactional
    public VoucherResponse createVoucher(CreateVoucherRequest request) {
        String code = request.getCode().trim().toUpperCase();

        if (voucherRepository.existsByCode(code)) {
            throw new BusinessException("Mã voucher '" + code + "' đã tồn tại");
        }

        VoucherEntity voucher = VoucherEntity.builder()
                .code(code)
                .name(request.getName())
                .discountType(request.getDiscountType())
                .discountValue(request.getDiscountValue())
                .minOrderAmount(request.getMinOrderAmount() != null ? request.getMinOrderAmount() : BigDecimal.ZERO)
                .maxDiscountAmount(request.getMaxDiscountAmount())
                .maxUsageCount(request.getMaxUsageCount())
                .maxUsagePerUser(request.getMaxUsagePerUser())
                .currentUsageCount(0)
                .validFrom(request.getValidFrom() != null ? request.getValidFrom() : Instant.now())
                .validUntil(request.getValidUntil())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .applicableTier(request.getApplicableTier() != null ? request.getApplicableTier() : "ALL")
                .build();

        VoucherEntity saved = voucherRepository.save(voucher);
        log.info("Created voucher: {} ({})", saved.getCode(), saved.getId());
        return toResponse(saved);
    }

    @Transactional
    public VoucherResponse updateVoucher(java.util.UUID id, UpdateVoucherRequest request) {
        VoucherEntity voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Voucher", "id", id));

        if (request.getName() != null) voucher.setName(request.getName());
        if (request.getDiscountType() != null) voucher.setDiscountType(request.getDiscountType());
        if (request.getDiscountValue() != null) voucher.setDiscountValue(request.getDiscountValue());
        if (request.getMinOrderAmount() != null) voucher.setMinOrderAmount(request.getMinOrderAmount());
        if (request.getMaxDiscountAmount() != null) voucher.setMaxDiscountAmount(request.getMaxDiscountAmount());
        if (request.getMaxUsageCount() != null) voucher.setMaxUsageCount(request.getMaxUsageCount());
        if (request.getMaxUsagePerUser() != null) voucher.setMaxUsagePerUser(request.getMaxUsagePerUser());
        if (request.getValidFrom() != null) voucher.setValidFrom(request.getValidFrom());
        if (request.getValidUntil() != null) voucher.setValidUntil(request.getValidUntil());
        if (request.getIsActive() != null) voucher.setIsActive(request.getIsActive());
        if (request.getApplicableTier() != null) voucher.setApplicableTier(request.getApplicableTier());

        VoucherEntity saved = voucherRepository.save(voucher);
        log.info("Updated voucher: {} ({})", saved.getCode(), saved.getId());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<VoucherResponse> listVouchers(Pageable pageable) {
        return voucherRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public VoucherResponse getVoucher(java.util.UUID id) {
        VoucherEntity voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Voucher", "id", id));
        return toResponse(voucher);
    }

    @Transactional(readOnly = true)
    public VoucherEntity getVoucherByCode(String code) {
        return voucherRepository.findByCode(code.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Voucher", "code", code));
    }

    @Transactional
    public void incrementUsage(String code) {
        voucherRepository.findByCodeForUpdate(code.trim().toUpperCase())
                .ifPresent(VoucherEntity::incrementUsage);
    }

    @Transactional
    public VoucherResponse toggleVoucher(UUID id) {
        VoucherEntity voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Voucher", "id", id));

        voucher.setIsActive(!Boolean.TRUE.equals(voucher.getIsActive()));
        VoucherEntity saved = voucherRepository.save(voucher);

        log.info("Toggled voucher {}: isActive = {}", saved.getCode(), saved.getIsActive());
        return toResponse(saved);
    }

    @Transactional
    public void deleteVoucher(UUID id) {
        VoucherEntity voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Voucher", "id", id));

        voucher.setIsActive(false);
        voucherRepository.save(voucher);

        log.info("Soft-deleted voucher: {} ({})", voucher.getCode(), id);
    }

    private VoucherResponse toResponse(VoucherEntity voucher) {
        return VoucherResponse.builder()
                .id(voucher.getId())
                .code(voucher.getCode())
                .name(voucher.getName())
                .discountType(voucher.getDiscountType())
                .discountValue(voucher.getDiscountValue())
                .minOrderAmount(voucher.getMinOrderAmount())
                .maxDiscountAmount(voucher.getMaxDiscountAmount())
                .maxUsageCount(voucher.getMaxUsageCount())
                .maxUsagePerUser(voucher.getMaxUsagePerUser())
                .currentUsageCount(voucher.getCurrentUsageCount())
                .validFrom(voucher.getValidFrom())
                .validUntil(voucher.getValidUntil())
                .isActive(voucher.getIsActive())
                .applicableTier(voucher.getApplicableTier())
                .createdAt(voucher.getCreatedAt())
                .build();
    }
}
