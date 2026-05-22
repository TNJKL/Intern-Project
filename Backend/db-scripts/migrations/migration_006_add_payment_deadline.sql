-- Migration 006: Add payment deadline and cancellation reason to orders
-- Author: Claude
-- Description: Add fields for order timeout tracking and cancellation reasons

-- Add payment_deadline column for tracking payment timeout
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_deadline TIMESTAMP WITH TIME ZONE;

-- Add cancellation_reason column to store why order was cancelled
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS cancellation_reason VARCHAR(500);

-- Create index for efficient timeout order queries
-- This index helps find PENDING orders that have exceeded their payment deadline
CREATE INDEX IF NOT EXISTS idx_orders_pending_timeout
ON orders (status, payment_deadline)
WHERE status = 'PENDING';

-- Create index for finding expired orders by deadline
CREATE INDEX IF NOT EXISTS idx_orders_payment_deadline
ON orders (payment_deadline)
WHERE payment_deadline IS NOT NULL;
