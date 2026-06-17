-- 14-add-retry-count-to-payments.sql
-- Thêm cột retry_count và max_retry vào bảng payments để giới hạn số lần thanh toán lại

ALTER TABLE payments
ADD COLUMN retry_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN max_retry INTEGER NOT NULL DEFAULT 2;
