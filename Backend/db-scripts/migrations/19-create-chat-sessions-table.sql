-- ============================================================
-- CHAT_DB - Chat Sessions Archive Table
-- ============================================================

\c chat_db;

SET client_encoding TO 'UTF8';

CREATE TABLE IF NOT EXISTS chat_sessions (
    id                  VARCHAR(255) PRIMARY KEY, -- Room ID from Firestore (e.g. room_user_id)
    customer_id         VARCHAR(255) NOT NULL,
    customer_name       VARCHAR(255) NOT NULL,
    customer_email      VARCHAR(255),
    assigned_admin_id   VARCHAR(255),
    assigned_admin_name VARCHAR(255),
    started_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    closed_at           TIMESTAMP WITH TIME ZONE,
    messages            JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_customer ON chat_sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_closed_at ON chat_sessions(closed_at DESC);
