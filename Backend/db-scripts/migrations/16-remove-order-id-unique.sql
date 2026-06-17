-- 16-remove-order-id-unique.sql
-- 1. Bỏ unique constraint trên order_id để cho phép thanh toán nhiều lần
-- 2. Cập nhật CHECK constraint trên status để cho phép giá trị REFUNDED

\c payment_db;

-- Bỏ unique constraint trên order_id
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_order_id_key;

-- Cập nhật CHECK constraint cho cột status để hỗ trợ REFUNDED
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE payments ADD CONSTRAINT payments_status_check 
    CHECK (status IN ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'EXPIRED', 'REFUNDED'));
