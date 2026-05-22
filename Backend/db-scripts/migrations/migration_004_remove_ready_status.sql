-- ============================================================
-- MIGRATION: Xóa status READY khỏi Order Status
-- ============================================================

\c order_db;

-- Bước 1: Update các đơn hàng có status 'READY' sang 'DELIVERING'
-- (READY là trạng thái trung gian trước khi giao hàng)
UPDATE orders
SET status = 'DELIVERING',
    updated_at = NOW()
WHERE status = 'READY';

-- Kiểm tra xem còn đơn nào có status READY không
DO $$
DECLARE
    ready_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO ready_count FROM orders WHERE status = 'READY';
    IF ready_count > 0 THEN
        RAISE WARNING 'Còn % đơn hàng có status READY chưa được xử lý', ready_count;
    ELSE
        RAISE NOTICE 'Tất cả đơn hàng đã được chuyển từ READY sang DELIVERING';
    END IF;
END $$;

-- Bước 2: Xóa CHECK constraint cũ và tạo CHECK constraint mới (ko có READY)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
    CHECK (status IN (
        'PENDING', 'CONFIRMED', 'PREPARING',
        'DELIVERING', 'COMPLETED', 'CANCELLED'
    ));

-- Verify
SELECT status, COUNT(*) as count
FROM orders
GROUP BY status
ORDER BY
    CASE status
        WHEN 'PENDING' THEN 1
        WHEN 'CONFIRMED' THEN 2
        WHEN 'PREPARING' THEN 3
        WHEN 'DELIVERING' THEN 4
        WHEN 'COMPLETED' THEN 5
        WHEN 'CANCELLED' THEN 6
    END;
