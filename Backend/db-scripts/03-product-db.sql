    -- ============================================================
    -- PRODUCT_DB - Product Catalog
    -- ============================================================

    \c product_db;

    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    -- ============================================================
    -- CATEGORIES
    -- ============================================================
    CREATE TABLE IF NOT EXISTS categories (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name            VARCHAR(100) NOT NULL,
        slug            VARCHAR(100) NOT NULL,
        image_url       VARCHAR(500),
        display_order   SMALLINT NOT NULL DEFAULT 0,
        is_active       BOOLEAN NOT NULL DEFAULT TRUE,
        deleted_at      TIMESTAMP WITH TIME ZONE,
        created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );

    -- ============================================================
    -- PRODUCTS
    -- ============================================================
    CREATE TABLE IF NOT EXISTS products (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category_id     UUID NOT NULL,
        name            VARCHAR(255) NOT NULL,
        slug            VARCHAR(255) NOT NULL,
        description     TEXT,
        image_url       VARCHAR(500),
        is_available    BOOLEAN NOT NULL DEFAULT TRUE,
        is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
        display_order   SMALLINT NOT NULL DEFAULT 0,
        deleted_at      TIMESTAMP WITH TIME ZONE,
        created_by      VARCHAR(128),
        updated_by      VARCHAR(128),
        created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );

    -- ============================================================
    -- PRODUCT VARIANTS (giá theo size / phiên bản)
    -- ============================================================
    CREATE TABLE IF NOT EXISTS product_variants (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id      UUID NOT NULL REFERENCES products (id) ON DELETE CASCADE,
        size_label      VARCHAR(50),
        price           DECIMAL(12,0) NOT NULL CHECK (price >= 0),
        is_available    BOOLEAN NOT NULL DEFAULT TRUE,
        display_order   SMALLINT NOT NULL DEFAULT 0,
        deleted_at      TIMESTAMP WITH TIME ZONE
    );

    -- ============================================================
    -- TOPPINGS
    -- ============================================================
    CREATE TABLE IF NOT EXISTS toppings (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name            VARCHAR(100) NOT NULL,
        image_url       VARCHAR(500),
        price           DECIMAL(12,0) NOT NULL DEFAULT 0 CHECK (price >= 0),
        is_available    BOOLEAN NOT NULL DEFAULT TRUE,
        display_order   SMALLINT NOT NULL DEFAULT 0,
        deleted_at      TIMESTAMP WITH TIME ZONE,
        created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );

    -- ============================================================
    -- PRODUCT TOPPINGS (Many-to-Many)
    -- ============================================================
    CREATE TABLE IF NOT EXISTS product_toppings (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id      UUID NOT NULL,
        topping_id      UUID NOT NULL,
        UNIQUE(product_id, topping_id)
    );

    -- ============================================================
    -- INDEXES
    -- ============================================================
    CREATE INDEX idx_products_category ON products(category_id);
    CREATE INDEX idx_products_slug ON products(slug);
    CREATE INDEX idx_products_available ON products(is_available, is_featured);
    CREATE INDEX idx_categories_deleted_at ON categories(deleted_at);
    CREATE INDEX idx_products_deleted_at ON products(deleted_at);
    CREATE INDEX idx_toppings_deleted_at ON toppings(deleted_at);

    CREATE UNIQUE INDEX uq_categories_slug_active ON categories (slug) WHERE deleted_at IS NULL;
    CREATE UNIQUE INDEX uq_products_slug_active ON products (slug) WHERE deleted_at IS NULL;
    CREATE INDEX idx_product_toppings_product ON product_toppings(product_id);
    CREATE INDEX idx_product_toppings_topping ON product_toppings(topping_id);

    CREATE INDEX idx_product_variants_product ON product_variants (product_id);
    CREATE INDEX idx_product_variants_product_active
        ON product_variants (product_id) WHERE deleted_at IS NULL;

    CREATE UNIQUE INDEX uq_product_variants_one_default_size
        ON product_variants (product_id)
        WHERE deleted_at IS NULL AND size_label IS NULL;

    CREATE UNIQUE INDEX uq_product_variants_size_per_product
        ON product_variants (product_id, size_label)
        WHERE deleted_at IS NULL AND size_label IS NOT NULL;

    -- DB cũ chưa có cột ảnh topping (bỏ comment và chạy một lần nếu cần):
    -- ALTER TABLE toppings ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
