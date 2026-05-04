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
    product_id      UUID NOT NULL UNIQUE,
    product_name    VARCHAR(255) NOT NULL,
    version         SMALLINT NOT NULL DEFAULT 1,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RECIPE INGREDIENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id       UUID NOT NULL,
    ingredient_id   UUID NOT NULL,
    quantity        DECIMAL(10,3) NOT NULL CHECK (quantity > 0),
    UNIQUE (recipe_id, ingredient_id)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_ingredients_name ON ingredients(name) WHERE is_active = TRUE;
CREATE INDEX idx_ingredients_low_stock ON ingredients(current_stock, low_stock_threshold)
    WHERE is_active = TRUE;

CREATE INDEX idx_recipes_product ON recipes(product_id);
CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_ingredient ON recipe_ingredients(ingredient_id);
