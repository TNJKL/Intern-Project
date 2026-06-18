-- 17-add-outbox-retry-columns.sql
-- Thêm các cột phục vụ cơ chế retry/dead-letter cho bảng outbox_events

\c payment_db;

ALTER TABLE outbox_events
ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_retry INTEGER NOT NULL DEFAULT 3,
ADD COLUMN IF NOT EXISTS error_message TEXT;
