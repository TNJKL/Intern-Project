\c payment_db;

ALTER TABLE refunds ADD COLUMN IF NOT EXISTS order_code VARCHAR(30);

-- Sync historical order_code values from payments table
UPDATE refunds r
SET order_code = p.order_code
FROM payments p
WHERE r.payment_id = p.id;
