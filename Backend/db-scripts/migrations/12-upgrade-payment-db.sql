-- ============================================================
-- 12-upgrade-payment-db.sql
-- Add idempotency features and expired time to payment tables
-- ============================================================

\c payment_db;

-- 1. Add idempotency_key to payments to avoid duplicate payment processing on FE retries
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100) UNIQUE;

-- 2. Add expired_at to payments to support VNPay URL expiration (usually 15 minutes)
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS expired_at TIMESTAMP WITH TIME ZONE;

-- 3. Add requested_by to refunds to track which Admin requested the refund
ALTER TABLE refunds
ADD COLUMN IF NOT EXISTS requested_by UUID;

-- 4. Create processed_events table for Kafka idempotent consumers
CREATE TABLE IF NOT EXISTS processed_events (
    event_id     VARCHAR(200) PRIMARY KEY,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
