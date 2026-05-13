-- ============================================================
-- NÂNG CẤP: product_variants + bỏ products.price
-- Chạy trên product_db đã có schema CŨ (cột products.price).
-- DB tạo mới chỉ cần 03-product-db.sql (đã gồm product_variants, không có price).
-- ============================================================

\c product_db;

-- Bảng + index (idempotent)
CREATE TABLE IF NOT EXISTS product_variants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id      UUID NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    size_label      VARCHAR(50),
    price           DECIMAL(12,0) NOT NULL CHECK (price >= 0),
    is_available    BOOLEAN NOT NULL DEFAULT TRUE,
    display_order   SMALLINT NOT NULL DEFAULT 0,
    deleted_at      TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants (product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_active
    ON product_variants (product_id) WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_product_variants_one_default_size
    ON product_variants (product_id)
    WHERE deleted_at IS NULL AND size_label IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_product_variants_size_per_product
    ON product_variants (product_id, size_label)
    WHERE deleted_at IS NULL AND size_label IS NOT NULL;

-- Backfill: 1 variant mặc định / sản phẩm (chỉ khi vẫn còn cột price)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'products'
          AND column_name = 'price'
    ) THEN
        INSERT INTO product_variants (id, product_id, size_label, price, is_available, display_order, deleted_at)
        SELECT gen_random_uuid(), p.id, NULL, p.price, p.is_available, p.display_order, NULL
        FROM products p
        WHERE NOT EXISTS (
            SELECT 1 FROM product_variants v WHERE v.product_id = p.id
        );
    END IF;
END $$;

ALTER TABLE products DROP COLUMN IF EXISTS price;
