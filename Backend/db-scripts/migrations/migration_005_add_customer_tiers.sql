-- ============================================================
-- MIGRATION: Thêm Customer Tier Loyalty System
-- ============================================================

\c order_db;

-- ============================================================
-- Bảng customer_tiers
-- ============================================================
CREATE TABLE IF NOT EXISTS customer_tiers (
    user_id         UUID PRIMARY KEY,
    tier            VARCHAR(20) NOT NULL DEFAULT 'GUEST'
                    CHECK (tier IN ('GUEST', 'MEMBER', 'VIP')),
    total_spent     DECIMAL(12,0) NOT NULL DEFAULT 0,
    total_orders    INTEGER NOT NULL DEFAULT 0,
    tier_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_tiers_tier ON customer_tiers(tier);
CREATE INDEX IF NOT EXISTS idx_customer_tiers_updated ON customer_tiers(tier_updated_at DESC);

-- ============================================================
-- Thêm applicable_tier vào vouchers
-- ============================================================
ALTER TABLE vouchers
    ADD COLUMN IF NOT EXISTS applicable_tier
        VARCHAR(20) NOT NULL DEFAULT 'ALL'
        CHECK (applicable_tier IN ('ALL', 'MEMBER', 'VIP'));

-- Cập nhật các voucher đã tồn tại thành 'ALL'
UPDATE vouchers SET applicable_tier = 'ALL' WHERE applicable_tier IS NULL;

-- ============================================================
-- Verify
-- ============================================================
DO $$
BEGIN
    RAISE NOTICE '=== Migration 005: Customer Tier System ===';

    -- Check customer_tiers
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'customer_tiers'
    ) THEN
        RAISE NOTICE '[OK] Table customer_tiers created';
    ELSE
        RAISE EXCEPTION '[FAIL] Table customer_tiers not found';
    END IF;

    -- Check applicable_tier column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'vouchers' AND column_name = 'applicable_tier'
    ) THEN
        RAISE NOTICE '[OK] Column applicable_tier added to vouchers';
    ELSE
        RAISE EXCEPTION '[FAIL] Column applicable_tier not found';
    END IF;

    RAISE NOTICE 'Migration 005 completed successfully';
END $$;
