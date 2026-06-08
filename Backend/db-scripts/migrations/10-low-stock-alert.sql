-- ============================================================
-- MIGRATION 10: Low Stock Alert
-- Ngày:    2026-06-05
-- Service: inventory-service
-- Mô tả:   Thêm 2 cột vào bảng ingredients để hỗ trợ
--          feature cảnh báo ngưỡng tồn kho tự động.
--
-- Chạy file này trên production database trước khi deploy
-- phiên bản có LowStockAlertService.
-- Với môi trường dev/staging: Hibernate ddl-auto:update
-- đã tự động thêm các cột này khi service khởi động.
-- ============================================================

\c inventory_db;

-- Thêm cột lưu phần trăm ngưỡng CRITICAL
-- Ví dụ: 5 → CRITICAL khi currentStock <= lowStockThreshold × 5%
ALTER TABLE ingredients
    ADD COLUMN IF NOT EXISTS critical_stock_threshold_pct INTEGER NOT NULL DEFAULT 5;

COMMENT ON COLUMN ingredients.critical_stock_threshold_pct IS
    '% so với low_stock_threshold. VD: 5 → CRITICAL khi currentStock <= lowThreshold × 5%.';

-- Thêm cột theo dõi trạng thái alert (cơ chế dedup)
-- NULL     = chưa gửi alert, hoặc đã nhập kho trở lại (reset)
-- NOT NULL = đã gửi alert lần này, không gửi lại cho đến khi restock
ALTER TABLE ingredients
    ADD COLUMN IF NOT EXISTS low_stock_alert_sent_at TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS last_alert_level VARCHAR(20) NULL;

COMMENT ON COLUMN ingredients.low_stock_alert_sent_at IS
    'NULL = chưa gửi hoặc đã restock. Có giá trị = đã gửi alert, không gửi lại đến khi nhập kho.';
COMMENT ON COLUMN ingredients.last_alert_level IS
    'Mức độ cảnh báo của lần gửi alert gần nhất (NULL/LOW/CRITICAL/OUT_OF_STOCK).';

-- Index hỗ trợ query lấy danh sách nguyên liệu đang cảnh báo
-- Dùng cho GET /api/v1/admin/ingredients/alerts (admin dashboard)
CREATE INDEX IF NOT EXISTS idx_ingredients_alert
    ON ingredients(current_stock, low_stock_threshold)
    WHERE current_stock <= low_stock_threshold;

-- Xác nhận migration đã chạy
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'ingredients'
  AND column_name IN ('critical_stock_threshold_pct', 'low_stock_alert_sent_at', 'last_alert_level')
ORDER BY column_name;
