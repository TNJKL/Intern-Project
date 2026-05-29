-- ============================================================
-- MIGRATION: Add voucher usage limits per user
-- ============================================================

\c order_db;

-- Add max_usage_per_user to vouchers
ALTER TABLE vouchers
ADD COLUMN IF NOT EXISTS max_usage_per_user INTEGER DEFAULT NULL;

-- Create voucher_usages table
CREATE TABLE IF NOT EXISTS voucher_usages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_id  UUID NOT NULL REFERENCES vouchers(id),
    user_id     UUID,
    user_email  VARCHAR(255),
    order_id    UUID NOT NULL REFERENCES orders(id),
    used_at     TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_user_or_email
        CHECK (user_id IS NOT NULL OR user_email IS NOT NULL)
);

-- Create index for voucher_usages
CREATE INDEX IF NOT EXISTS idx_voucher_usages_user
ON voucher_usages(voucher_id, user_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_voucher_usages_email
ON voucher_usages(voucher_id, user_email) WHERE user_email IS NOT NULL;

-- Verify
DO $$
BEGIN
    RAISE NOTICE '=== Migration 007: Voucher Usage Limits ===';

    -- Check table voucher_usages
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'voucher_usages'
    ) THEN
        RAISE NOTICE '[OK] Table voucher_usages created';
    ELSE
        RAISE EXCEPTION '[FAIL] Table voucher_usages not found';
    END IF;

    -- Check max_usage_per_user column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'vouchers' AND column_name = 'max_usage_per_user'
    ) THEN
        RAISE NOTICE '[OK] Column max_usage_per_user added to vouchers';
    ELSE
        RAISE EXCEPTION '[FAIL] Column max_usage_per_user not found';
    END IF;

    RAISE NOTICE 'Migration 007 completed successfully';
END $$;
