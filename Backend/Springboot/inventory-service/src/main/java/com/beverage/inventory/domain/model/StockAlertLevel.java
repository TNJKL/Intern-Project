package com.beverage.inventory.domain.model;

/**
 * Mức độ cảnh báo tồn kho nguyên liệu.
 *
 * <ul>
 *   <li>{@code NORMAL}      – currentStock > lowStockThreshold → không cảnh báo</li>
 *   <li>{@code LOW}         – currentStock <= lowStockThreshold → IN_APP notification</li>
 *   <li>{@code CRITICAL}    – currentStock <= criticalAbsolute (= lowThreshold × pct/100) → IN_APP + Email</li>
 *   <li>{@code OUT_OF_STOCK}– currentStock == 0 → IN_APP + Email khẩn cấp + set isActive=false</li>
 * </ul>
 */
public enum StockAlertLevel {
    NORMAL,
    LOW,
    CRITICAL,
    OUT_OF_STOCK
}
