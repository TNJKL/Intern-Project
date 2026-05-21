package com.beverage.order.domain.model;

import java.math.BigDecimal;

public enum CustomerTier {
    GUEST,
    MEMBER,
    VIP;

    public boolean canUseVoucherTier(String voucherTier) {
        if (voucherTier == null || voucherTier.equals("ALL")) {
            return true;
        }
        try {
            CustomerTier required = CustomerTier.valueOf(voucherTier);
            return this.ordinal() >= required.ordinal();
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    public static CustomerTier calculateTier(BigDecimal totalSpent, int totalOrders) {
        if (totalSpent == null) {
            totalSpent = BigDecimal.ZERO;
        }
        if (totalSpent.compareTo(new BigDecimal("3000000")) >= 0 || totalOrders >= 20) {
            return VIP;
        }
        if (totalSpent.compareTo(new BigDecimal("500000")) >= 0 || totalOrders >= 5) {
            return MEMBER;
        }
        return GUEST;
    }

    public String getDisplayName() {
        return switch (this) {
            case GUEST -> "Khách vãng lai";
            case MEMBER -> "Khách hàng thân thiết";
            case VIP -> "Khách VIP";
        };
    }
}
