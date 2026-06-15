-- 13-add-order-status-to-payments.sql
-- Thêm cột order_status vào bảng payments để lưu vết trạng thái đơn hàng phục vụ đối soát thanh toán

ALTER TABLE payments ADD COLUMN order_status VARCHAR(30) DEFAULT 'PENDING';
