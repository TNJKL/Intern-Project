-- ============================================================
-- ORDER_DB - Orders & Vouchers
-- ============================================================

\c order_db;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- VOUCHERS
-- ============================================================
CREATE TABLE IF NOT EXISTS vouchers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code                VARCHAR(50) UNIQUE NOT NULL,
    name                VARCHAR(255) NOT NULL,
    discount_type       VARCHAR(20) NOT NULL CHECK (discount_type IN ('PERCENTAGE', 'FIXED_AMOUNT')),
    discount_value      DECIMAL(12,2) NOT NULL CHECK (discount_value > 0),
    min_order_amount    DECIMAL(12,0) NOT NULL DEFAULT 0,
    max_usage_count     INTEGER,
    current_usage_count INTEGER NOT NULL DEFAULT 0,
    valid_from          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    valid_until         TIMESTAMP WITH TIME ZONE,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_code          VARCHAR(30) UNIQUE NOT NULL,
    user_id             UUID NOT NULL,
    user_email          VARCHAR(255) NOT NULL,
    user_name           VARCHAR(255) NOT NULL,
    user_phone          VARCHAR(20),
    status              VARCHAR(30) NOT NULL DEFAULT 'PENDING'
                        CHECK (status IN (
                            'PENDING', 'CONFIRMED', 'PREPARING',
                            'DELIVERING', 'COMPLETED', 'CANCELLED'
                        )),
    subtotal            DECIMAL(12,0) NOT NULL,
    discount_amount     DECIMAL(12,0) NOT NULL DEFAULT 0,
    total_amount        DECIMAL(12,0) NOT NULL,
    voucher_id          UUID,
    payment_deadline    TIMESTAMP WITH TIME ZONE NOT NULL,
    cancellation_reason VARCHAR(500),
    delivery_address    TEXT,
    payment_method      VARCHAR(30),
    note                TEXT,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL,
    product_id      UUID NOT NULL,
    variant_id      UUID NOT NULL,
    variant_label   VARCHAR(50),
    product_name    VARCHAR(255) NOT NULL,
    toppings        JSONB NOT NULL DEFAULT '[]',
    unit_price      DECIMAL(12,0) NOT NULL,
    quantity        SMALLINT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    subtotal        DECIMAL(12,0) NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ORDER STATUS HISTORY (để khách xem lại lịch sử)
-- ============================================================
CREATE TABLE IF NOT EXISTS order_status_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL,
    status          VARCHAR(30) NOT NULL,
    note            TEXT,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_vouchers_code ON vouchers(code) WHERE is_active = TRUE;
CREATE INDEX idx_vouchers_validity ON vouchers(valid_from, valid_until) WHERE is_active = TRUE;

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_code ON orders(order_code);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_pending_timeout ON orders(status, payment_deadline) WHERE status = 'PENDING';
CREATE INDEX idx_orders_payment_deadline ON orders(payment_deadline) WHERE payment_deadline IS NOT NULL;

CREATE INDEX idx_order_items_order ON order_items(order_id);

CREATE INDEX idx_order_history_order ON order_status_history(order_id);
CREATE INDEX idx_order_history_created ON order_status_history(created_at DESC);


-- ============================================================
-- AUTO GENERATE ORDER CODE
-- ============================================================
CREATE OR REPLACE FUNCTION generate_order_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_code IS NULL OR NEW.order_code = '' THEN
        NEW.order_code := 'ORD' || TO_CHAR(NOW(), 'YYMMDD') || '-' || SUBSTRING(gen_random_uuid()::TEXT, 1, 8);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_order_code
    BEFORE INSERT ON orders FOR EACH ROW EXECUTE FUNCTION generate_order_code();
