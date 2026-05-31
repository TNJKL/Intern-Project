-- ============================================================
-- INVENTORY_DB - Ingredients & Recipes
-- ============================================================

\c inventory_db;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- INGREDIENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS ingredients (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(100) NOT NULL,
    sku                 VARCHAR(50) UNIQUE,
    unit                VARCHAR(20) NOT NULL,
    current_stock       DECIMAL(12,3) NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
    low_stock_threshold DECIMAL(12,3) NOT NULL DEFAULT 10,
    cost_per_unit       DECIMAL(12,2),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RECIPES (link products to ingredients)
-- ============================================================
CREATE TABLE IF NOT EXISTS recipes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id      UUID NOT NULL,
    variant_id      UUID,
    product_name    VARCHAR(255) NOT NULL,
    version         SMALLINT NOT NULL DEFAULT 1,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (product_id, variant_id)
);

-- ============================================================
-- RECIPE INGREDIENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id       UUID NOT NULL REFERENCES recipes(id),
    ingredient_id   UUID NOT NULL REFERENCES ingredients(id),
    quantity        DECIMAL(10,3) NOT NULL CHECK (quantity > 0),
    UNIQUE (recipe_id, ingredient_id)
);

-- ============================================================
-- INVENTORY TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_id   UUID NOT NULL REFERENCES ingredients(id),
    order_id        UUID,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN (
                        'DEDUCT',    -- trừ khi đặt hàng
                        'RESTORE',   -- hoàn khi hủy đơn
                        'RESTOCK',   -- nhập kho
                        'ADJUST'     -- điều chỉnh thủ công
                    )),
    quantity        DECIMAL(10,3) NOT NULL,
    quantity_before DECIMAL(10,3) NOT NULL,  -- tồn kho trước
    quantity_after  DECIMAL(10,3) NOT NULL,  -- tồn kho sau
    note            TEXT,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PROCESSED EVENTS (Idempotency)
-- ============================================================
CREATE TABLE IF NOT EXISTS processed_events (
    event_id     VARCHAR(200) PRIMARY KEY,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_ingredients_name ON ingredients(name) WHERE is_active = TRUE;
CREATE INDEX idx_ingredients_low_stock ON ingredients(current_stock, low_stock_threshold) WHERE is_active = TRUE;

CREATE INDEX idx_recipes_product ON recipes(product_id);
CREATE INDEX idx_recipes_product_variant ON recipes(product_id, variant_id);
CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_ingredient ON recipe_ingredients(ingredient_id);

CREATE INDEX idx_inv_transactions_ingredient ON inventory_transactions(ingredient_id, created_at DESC);
CREATE INDEX idx_inv_transactions_order ON inventory_transactions(order_id) WHERE order_id IS NOT NULL;
