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
    user_id         UUID,
    user_email      VARCHAR(255),
    reference_type  VARCHAR(50),
    reference_id    UUID,
    template_id     UUID REFERENCES notification_templates(id),
    channel         VARCHAR(20) NOT NULL CHECK (channel IN ('EMAIL', 'SMS', 'PUSH', 'IN_APP')),
    title           VARCHAR(255) NOT NULL,
    body            TEXT,
    data            JSONB DEFAULT '{}',
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                    CHECK (status IN ('PENDING', 'SENT', 'FAILED', 'READ')),
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    sent_at         TIMESTAMP WITH TIME ZONE,
    CONSTRAINT chk_user_or_email CHECK (user_id IS NOT NULL OR user_email IS NOT NULL)
);

-- ============================================================
-- PROCESSED EVENTS (Idempotency)
-- ============================================================
CREATE TABLE IF NOT EXISTS processed_events (
    event_id       VARCHAR(200) PRIMARY KEY,
    processed_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_notification_templates_code ON notification_templates(code) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_user_email ON notifications(user_email) WHERE user_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_reference ON notifications(reference_type, reference_id)
    WHERE reference_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_processed_events_at ON processed_events(processed_at);

-- Chạy định kỳ xóa event cũ hơn 7 ngày
DELETE FROM processed_events WHERE processed_at < NOW() - INTERVAL '7 days';

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
     'Thanh toán cho đơn hàng #{{order_code}} đã được xác nhận.'),
    ('ORDER_TIMEOUT', 'Đơn hàng quá hạn thanh toán', 'EMAIL',
     'Đơn hàng #{{order_code}} đã bị hủy tự động',
     'Đơn hàng #{{order_code}} đã bị hủy do quá hạn thanh toán. Lý do: {{reason}}.'),
    ('TIER_UPGRADED', 'Lên hạng thành viên', 'EMAIL',
     'Chúc mừng bạn lên hạng {{tier}}!',
     'Chúc mừng bạn đã đạt hạng {{tier}} với tổng chi tiêu {{total_spent}}đ.')
ON CONFLICT (code) DO NOTHING;
