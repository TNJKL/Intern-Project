\c inventory_db;

-- Bổ sung cột created_by vào bảng inventory_transactions
ALTER TABLE inventory_transactions
ADD COLUMN IF NOT EXISTS created_by UUID NULL;

-- Cập nhật check constraint của transaction_type để chấp nhận MANUAL_RESTORE
ALTER TABLE inventory_transactions DROP CONSTRAINT IF EXISTS inventory_transactions_transaction_type_check;
ALTER TABLE inventory_transactions ADD CONSTRAINT inventory_transactions_transaction_type_check 
CHECK (transaction_type IN ('DEDUCT', 'RESTORE', 'RESTOCK', 'ADJUST', 'MANUAL_RESTORE'));
