-- ============================================================
-- PAYMENT_DB - Payments & Refunds
-- ============================================================

\c payment_db;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID NOT NULL UNIQUE,
    order_code          VARCHAR(30) NOT NULL,
    user_id             UUID ,
    amount              DECIMAL(12,0) NOT NULL CHECK (amount > 0),
    payment_method      VARCHAR(30) NOT NULL CHECK (payment_method IN ('VNPAY', 'MOMO', 'COD')),
    status              VARCHAR(30) NOT NULL DEFAULT 'PENDING'
                        CHECK (status IN ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'EXPIRED')),
    transaction_id      VARCHAR(255),
    payment_url         VARCHAR(1000),
    gateway_response    JSONB,
    paid_at             TIMESTAMP WITH TIME ZONE,
    idempotency_key     VARCHAR(100) UNIQUE,
    expired_at          TIMESTAMP WITH TIME ZONE,
    order_status        VARCHAR(30) DEFAULT 'PENDING',
    retry_count         INTEGER NOT NULL DEFAULT 0,
    max_retry           INTEGER NOT NULL DEFAULT 2,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================
-- REFUNDS
-- ============================================================
CREATE TABLE IF NOT EXISTS refunds (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id          UUID NOT NULL,
    order_id            UUID NOT NULL,
    user_id             UUID ,
    amount              DECIMAL(12,0) NOT NULL CHECK (amount > 0),
    reason              TEXT NOT NULL,
    status              VARCHAR(30) NOT NULL DEFAULT 'PENDING'
                        CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    transaction_id      VARCHAR(255),
    requested_by        UUID,
    processed_at        TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PROCESSED EVENTS FOR KAFKA IDEMPOTENCY
-- ============================================================
CREATE TABLE IF NOT EXISTS processed_events (
    event_id     VARCHAR(200) PRIMARY KEY,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_order_code ON payments(order_code);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created ON payments(created_at DESC);

CREATE INDEX idx_refunds_payment ON refunds(payment_id);
CREATE INDEX idx_refunds_order ON refunds(order_id);
CREATE INDEX idx_refunds_user ON refunds(user_id);
CREATE INDEX idx_refunds_status ON refunds(status);
