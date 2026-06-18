-- Migration to add processed_events table for order-service idempotency
CREATE TABLE IF NOT EXISTS processed_events (
    event_id          VARCHAR(200) PRIMARY KEY,
    processed_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

