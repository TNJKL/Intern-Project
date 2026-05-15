-- ============================================================
-- SOFT DELETE catalog (categories, products, toppings)
-- + partial UNIQUE slug (chỉ áp dụng bản ghi deleted_at IS NULL)
-- Chạy một lần trên product_db đã có schema cũ (UNIQUE slug toàn bảng).
-- DB tạo mới: dùng 03-product-db.sql đã cập nhật — không bắt buộc chạy file này.
-- ============================================================

\c product_db;

ALTER TABLE categories ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
ALTER TABLE toppings ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

-- Bỏ UNIQUE chỉ trên cột slug (tên có thể là {table}_slug_key hoặc tên ngẫu nhiên do Hibernate/JPA)
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT rel.relname AS tbl, con.conname AS cname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname IN ('categories', 'products')
      AND con.contype = 'u'
      AND cardinality(con.conkey) = 1
      AND EXISTS (
        SELECT 1 FROM pg_attribute att
        WHERE att.attrelid = con.conrelid
          AND att.attnum = con.conkey[1]
          AND att.attname = 'slug'
      )
  LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', r.tbl, r.cname);
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_categories_slug_active
    ON categories (slug) WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_products_slug_active
    ON products (slug) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_categories_deleted_at ON categories (deleted_at);
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products (deleted_at);
CREATE INDEX IF NOT EXISTS idx_toppings_deleted_at ON toppings (deleted_at);
