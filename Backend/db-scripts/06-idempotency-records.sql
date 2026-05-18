-- Idempotency Records Table
-- Purpose: Prevent duplicate order creation on client retry

CREATE TABLE IF NOT EXISTS idempotency_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key VARCHAR(64) UNIQUE NOT NULL,
    endpoint        VARCHAR(255) NOT NULL,
    request_hash    VARCHAR(64),
    response_body   TEXT,
    status_code     INT,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at      TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_idempotency_key ON idempotency_records(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_idempotency_expires ON idempotency_records(expires_at);
