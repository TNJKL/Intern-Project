-- ============================================================
-- MIGRATION: Add cancelled_at to orders
-- ============================================================

\c order_db;

-- Add cancelled_at column to orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Verify
DO $$
BEGIN
    RAISE NOTICE '=== Migration 008: Add cancelled_at to orders ===';

    -- Check cancelled_at column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'cancelled_at'
    ) THEN
        RAISE NOTICE '[OK] Column cancelled_at added to orders';
    ELSE
        RAISE EXCEPTION '[FAIL] Column cancelled_at not found';
    END IF;

    RAISE NOTICE 'Migration 008 completed successfully';
END $$;
