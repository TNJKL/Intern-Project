-- ============================================================
-- NOTIFICATION_DB - Notifications & Templates
-- ============================================================

\c notification_db;

-- Fix encoding để đảm bảo tiếng Việt không bị lỗi ký tự
SET client_encoding TO 'UTF8';

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
-- Xóa templates cũ bị lỗi encoding và insert lại đúng.
-- Code khớp với Kafka event type để dễ trace.
-- Suffix _EMAIL = email channel, không có suffix = IN_APP (primary).
-- ============================================================

-- Xóa templates cũ (bị lỗi ký tự tiếng Việt hoặc sai code)
DELETE FROM notification_templates;

INSERT INTO notification_templates (code, name, channel, title, body) VALUES

    -- -------------------------------------------------------
    -- ORDER_CREATED: Kafka gửi khi đơn hàng vừa được tạo
    -- -------------------------------------------------------
    ('ORDER_CREATED',
     'Đặt hàng thành công (In-App)',
     'IN_APP',
     'Đơn hàng #{{order_code}} đã được tạo',
     'Cảm ơn bạn đã đặt hàng! Đơn hàng #{{order_code}} đang được xử lý.'),

    ('ORDER_CREATED_EMAIL',
     'Xác nhận đặt hàng (Email)',
     'EMAIL',
     'Xác nhận đơn hàng #{{order_code}}',
     'Cảm ơn bạn đã đặt hàng! Đơn hàng #{{order_code}} đã được xác nhận.'),

    -- -------------------------------------------------------
    -- ORDER_STATUS_CHANGED: Kafka gửi khi trạng thái thay đổi
    -- Chỉ có IN_APP, không gửi email cho từng status change
    -- -------------------------------------------------------
    ('ORDER_STATUS_CHANGED',
     'Cập nhật trạng thái đơn hàng (In-App)',
     'IN_APP',
     'Đơn hàng #{{order_code}} - {{current_status}}',
     'Đơn hàng #{{order_code}} chuyển sang: {{current_status}}. {{note}}'),

    -- -------------------------------------------------------
    -- ORDER_COMPLETED: Kafka gửi khi đơn hoàn thành
    -- Thay thế PAYMENT_SUCCESS (đã đổi tên ở Spring Boot)
    -- -------------------------------------------------------
    ('ORDER_COMPLETED',
     'Đơn hàng hoàn thành (In-App)',
     'IN_APP',
     'Đơn hàng hoàn thành',
     'Đơn hàng #{{order_code}} của bạn đã hoàn thành. Cảm ơn!'),

    ('ORDER_COMPLETED_EMAIL',
     'Đơn hàng hoàn thành (Email)',
     'EMAIL',
     'Đơn hàng #{{order_code}} hoàn thành',
     'Đơn hàng #{{order_code}} đã hoàn thành. Cảm ơn bạn đã tin tưởng!'),

    -- -------------------------------------------------------
    -- ORDER_CANCELLED: Kafka gửi khi đơn bị hủy (thủ công)
    -- -------------------------------------------------------
    ('ORDER_CANCELLED',
     'Đơn hàng bị hủy (In-App)',
     'IN_APP',
     'Đơn hàng #{{order_code}} đã bị hủy',
     'Đơn hàng #{{order_code}} đã bị hủy. Lý do: {{reason}}'),

    ('ORDER_CANCELLED_EMAIL',
     'Đơn hàng bị hủy (Email)',
     'EMAIL',
     'Đơn hàng #{{order_code}} đã bị hủy',
     'Đơn hàng #{{order_code}} đã bị hủy. Lý do: {{reason}}'),

    -- -------------------------------------------------------
    -- ORDER_TIMEOUT: Kafka gửi khi đơn quá hạn thanh toán
    -- -------------------------------------------------------
    ('ORDER_TIMEOUT',
     'Đơn hàng quá hạn thanh toán (In-App)',
     'IN_APP',
     'Đơn hàng #{{order_code}} đã bị hủy tự động',
     'Đơn hàng #{{order_code}} đã bị hủy do quá hạn thanh toán.'),

    ('ORDER_TIMEOUT_EMAIL',
     'Đơn hàng quá hạn thanh toán (Email)',
     'EMAIL',
     'Đơn hàng #{{order_code}} đã bị hủy tự động',
     'Đơn hàng #{{order_code}} đã bị hủy do quá hạn thanh toán. Lý do: {{reason}}.'),

    -- -------------------------------------------------------
    -- TIER_UPGRADED: Gửi khi user lên hạng thành viên
    -- -------------------------------------------------------
    ('TIER_UPGRADED',
     'Lên hạng thành viên (In-App)',
     'IN_APP',
     'Chúc mừng bạn lên hạng {{tier}}!',
     'Bạn đã đạt hạng {{tier}} với tổng chi tiêu {{total_spent}}đ.'),

    ('TIER_UPGRADED_EMAIL',
     'Lên hạng thành viên (Email)',
     'EMAIL',
     'Chúc mừng bạn lên hạng {{tier}}!',
     'Chúc mừng bạn đã đạt hạng {{tier}} với tổng chi tiêu {{total_spent}}đ.'),

    -- -------------------------------------------------------
    -- LOW_STOCK_ALERT: Gửi cho admin khi nguyên liệu chạm ngưỡng LOW
    -- Chỉ IN_APP — không gửi email
    -- -------------------------------------------------------
    ('LOW_STOCK_ALERT',
     'Cảnh báo tồn kho thấp (In-App)',
     'IN_APP',
     '[Kho] {{ingredient_name}} sắp hết hàng',
     'Nguyên liệu {{ingredient_name}} còn {{current_stock}} {{unit}} — sắp đến ngưỡng cảnh báo ({{low_stock_threshold}} {{unit}}).'),

    -- -------------------------------------------------------
    -- LOW_STOCK_ALERT_CRITICAL: Gửi khi nguyên liệu chạm ngưỡng CRITICAL
    -- IN_APP + Email admin một lần duy nhất
    -- -------------------------------------------------------
    ('LOW_STOCK_ALERT_CRITICAL',
     'Cảnh báo tồn kho nghiêm trọng (In-App)',
     'IN_APP',
     '⚠️ [Kho] {{ingredient_name}} gần hết!',
     'Nguyên liệu {{ingredient_name}} còn {{current_stock}} {{unit}} — dưới ngưỡng nghiêm trọng ({{critical_absolute}} {{unit}}). Vui lòng nhập kho ngay!'),

    ('LOW_STOCK_ALERT_CRITICAL_EMAIL',
     'Cảnh báo tồn kho nghiêm trọng (Email)',
     'EMAIL',
     '⚠️ Cảnh báo kho: {{ingredient_name}} gần hết hàng',
     'Nguyên liệu {{ingredient_name}} còn {{current_stock}} {{unit}} — dưới {{critical_pct}}% ngưỡng cảnh báo. Nhập kho ngay để tránh gián đoạn!'),

    -- -------------------------------------------------------
    -- LOW_STOCK_ALERT_OUT: Gửi khi nguyên liệu hết hoàn toàn (stock = 0)
    -- IN_APP + Email admin khẩn cấp
    -- -------------------------------------------------------
    ('LOW_STOCK_ALERT_OUT',
     'Hết hàng hoàn toàn (In-App)',
     'IN_APP',
     '🔴 [Kho] {{ingredient_name}} đã HẾT HÀNG',
     'Nguyên liệu {{ingredient_name}} đã hết hoàn toàn (0 {{unit}}). Sản phẩm liên quan đã tự động bị ẩn. Nhập kho ngay!'),

    ('LOW_STOCK_ALERT_OUT_EMAIL',
     'Hết hàng hoàn toàn (Email)',
     'EMAIL',
     '🔴 KHẨN CẤP: {{ingredient_name}} đã hết hàng',
     'Nguyên liệu {{ingredient_name}} đã hết hoàn toàn. Hệ thống đã tự động ẩn các sản phẩm liên quan. Vui lòng nhập kho ngay lập tức để tiếp tục phục vụ khách hàng!')

ON CONFLICT (code) DO UPDATE
    SET name       = EXCLUDED.name,
        channel    = EXCLUDED.channel,
        title      = EXCLUDED.title,
        body       = EXCLUDED.body,
        updated_at = NOW();

