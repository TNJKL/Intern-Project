-- ============================================================
-- NOTIFICATION_DB - Notifications & Templates
-- ============================================================

\c notification_db;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- NOTIFICATION TEMPLATES
-- ============================================================
CREATE TABLE IF NOT EXISTS notification_templates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(100) UNIQUE NOT NULL,
    name            VARCHAR(255) NOT NULL,
    channel         VARCHAR(20) NOT NULL CHECK (channel IN ('EMAIL', 'SMS', 'PUSH', 'IN_APP')),
    title           VARCHAR(255) NOT NULL,
    body            TEXT NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL,
    reference_type  VARCHAR(50),
    reference_id    UUID,
    template_id     UUID,
    channel         VARCHAR(20) NOT NULL CHECK (channel IN ('EMAIL', 'SMS', 'PUSH', 'IN_APP')),
    title           VARCHAR(255) NOT NULL,
    body            TEXT,
    data            JSONB DEFAULT '{}',
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_notification_templates_code ON notification_templates(code) WHERE is_active = TRUE;
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_reference ON notifications(reference_type, reference_id)
    WHERE reference_type IS NOT NULL;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ============================================================
-- DEFAULT TEMPLATES
-- ============================================================
INSERT INTO notification_templates (code, name, channel, title, body) VALUES
    ('ORDER_CONFIRMATION', 'Xác nhận đơn hàng', 'EMAIL',
     'Xác nhận đơn hàng #{{order_code}}',
     'Cảm ơn bạn đã đặt hàng! Đơn hàng #{{order_code}} đã được xác nhận.'),
    ('ORDER_STATUS_UPDATE', 'Cập nhật trạng thái đơn hàng', 'IN_APP',
     'Đơn hàng #{{order_code}} - {{status}}',
     'Đơn hàng của bạn đã được cập nhật sang trạng thái: {{status}}'),
    ('PAYMENT_SUCCESS', 'Thanh toán thành công', 'EMAIL',
     'Thanh toán thành công',
     'Thanh toán cho đơn hàng #{{order_code}} đã được xác nhận.');
