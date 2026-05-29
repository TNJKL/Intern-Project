package com.beverage.inventory.domain.model;

public enum InventoryTransactionType {
    DEDUCT,    // trừ khi đặt hàng
    RESTORE,   // hoàn khi hủy đơn
    RESTOCK,   // nhập kho
    ADJUST     // điều chỉnh thủ công
}
