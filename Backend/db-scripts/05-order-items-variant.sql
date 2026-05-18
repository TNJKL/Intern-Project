-- Migration cho DB order_db đã tạo trước khi có variant snapshot
\c order_db;

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_id UUID;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_label VARCHAR(50);

-- Chỉ bắt buộc NOT NULL khi không còn dòng legacy (dev có thể xóa order_items cũ rồi chạy lại)
-- ALTER TABLE order_items ALTER COLUMN variant_id SET NOT NULL;
