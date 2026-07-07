CREATE EXTENSION IF NOT EXISTS dblink;

DO $$
DECLARE
    -- Biến hỗ trợ vòng lặp variants lấy từ dblink
    r RECORD;
    
    -- ID lưu trữ tạm
    curr_recipe_id UUID;
    curr_ing_id UUID;
    
    -- Biến tính toán định lượng
    multiplier numeric;
BEGIN
    RAISE NOTICE '=== BẮT ĐẦU ĐỒNG BỘ CÔNG THỨC SẠCH (RECIPES) ===';

    -- 1. Dọn dẹp sạch công thức cũ để seed sạch mới
    DELETE FROM recipe_ingredients;
    DELETE FROM recipes;
    RAISE NOTICE '-> Đã dọn dẹp các công thức cũ.';

    -- 2. Truy vấn chéo sang product_db lấy toàn bộ variants đang hoạt động của 40 sản phẩm sạch
    -- dblink kết nối cục bộ trong container Postgres bằng thông tin kết nối mặc định
    FOR r IN 
        SELECT * FROM dblink(
            'dbname=product_db user=postgres password=yourpassword',
            'SELECT p.id AS product_id, pv.id AS variant_id, p.name AS product_name, p.slug AS product_slug, pv.size_label 
             FROM products p 
             JOIN product_variants pv ON p.id = pv.product_id 
             WHERE p.deleted_at IS NULL AND pv.deleted_at IS NULL'
        ) AS link_data(product_id UUID, variant_id UUID, product_name VARCHAR, product_slug VARCHAR, size_label VARCHAR)
    LOOP
        -- Tạo mới công thức (recipes) liên kết cho từng variant (truyền tường minh gen_random_uuid())
        INSERT INTO recipes (id, product_id, variant_id, product_name, version, is_active, created_at, updated_at)
        VALUES (gen_random_uuid(), r.product_id, r.variant_id, r.product_name, 1, TRUE, NOW(), NOW())
        RETURNING id INTO curr_recipe_id;

        -- Xác định hệ số định lượng theo size (S=1.0, M=1.25, L=1.5, mặc định=1.0)
        multiplier := 1.0;
        IF r.size_label = 'M' THEN
            multiplier := 1.25;
        ELSIF r.size_label = 'L' THEN
            multiplier := 1.5;
        END IF;

        -- Định nghĩa công thức nguyên liệu dựa trên slug của sản phẩm
        -- A. NHÓM CÀ PHÊ PHIN
        IF r.product_slug = 'ca-phe-den-da-phin' THEN
            -- Cà phê Robusta: 20g
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-COFFEE-ROBUSTA';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.02 * multiplier);
            END IF;
            -- Nước đường: 10ml
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-SUGAR-LIQUID';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.01 * multiplier);
            END IF;

        ELSIF r.product_slug = 'ca-phe-sua-da-phin' THEN
            -- Cà phê Robusta: 20g
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-COFFEE-ROBUSTA';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.02 * multiplier);
            END IF;
            -- Sữa đặc: 30ml
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-MILK-CONDENSED';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.03 * multiplier);
            END IF;

        ELSIF r.product_slug = 'bac-xiu-brewtra' THEN
            -- Cà phê Robusta: 10g
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-COFFEE-ROBUSTA';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.01 * multiplier);
            END IF;
            -- Sữa đặc: 40ml
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-MILK-CONDENSED';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.04 * multiplier);
            END IF;
            -- Sữa tươi: 120ml
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-MILK-FRESH';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.12 * multiplier);
            END IF;

        ELSIF r.product_slug = 'ca-phe-trung-nuong' THEN
            -- Cà phê Robusta: 20g
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-COFFEE-ROBUSTA';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.02);
            END IF;
            -- Sữa đặc: 20ml
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-MILK-CONDENSED';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.02);
            END IF;
            -- Trứng gà: 1 quả
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-EGG';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 1.0);
            END IF;

        -- B. NHÓM CÀ PHÊ MÁY
        ELSIF r.product_slug = 'ca-phe-espresso' THEN
            -- Cà phê Arabica: 18g
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-COFFEE-ARABICA';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.018);
            END IF;

        ELSIF r.product_slug = 'ca-phe-americano' THEN
            -- Cà phê Arabica: 18g
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-COFFEE-ARABICA';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.018);
            END IF;

        ELSIF r.product_slug = 'ca-phe-latte-y' THEN
            -- Cà phê Arabica: 18g
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-COFFEE-ARABICA';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.018 * multiplier);
            END IF;
            -- Sữa tươi: 150ml
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-MILK-FRESH';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.15 * multiplier);
            END IF;

        ELSIF r.product_slug = 'ca-phe-cappuccino' THEN
            -- Cà phê Arabica: 18g
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-COFFEE-ARABICA';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.018 * multiplier);
            END IF;
            -- Sữa tươi: 120ml
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-MILK-FRESH';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.12 * multiplier);
            END IF;

        -- C. NHÓM TRÀ SỮA
        ELSIF r.product_slug = 'tra-sua-o-long-brewtra' THEN
            -- Trà Ô Long: 5g
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-TEA-OOLONG';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.005 * multiplier);
            END IF;
            -- Sữa tươi: 100ml
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-MILK-FRESH';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.1 * multiplier);
            END IF;
            -- Sữa đặc: 20ml
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-MILK-CONDENSED';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.02 * multiplier);
            END IF;

        ELSIF r.product_slug = 'tra-sua-matcha-uji' THEN
            -- Bột Matcha: 4g
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-TEA-MATCHA';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.004 * multiplier);
            END IF;
            -- Sữa tươi: 120ml
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-MILK-FRESH';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.12 * multiplier);
            END IF;
            -- Nước đường: 20ml
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-SUGAR-LIQUID';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.02 * multiplier);
            END IF;

        ELSIF r.product_slug = 'tra-sua-truyen-thong' THEN
            -- Trà đen: 5g
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-TEA-BLACK';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.005 * multiplier);
            END IF;
            -- Sữa tươi: 100ml
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-MILK-FRESH';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.1 * multiplier);
            END IF;
            -- Sữa đặc: 20ml
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-MILK-CONDENSED';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.02 * multiplier);
            END IF;

        ELSIF r.product_slug = 'tra-sua-lai-thanh-mat' THEN
            -- Trà lài: 5g
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-TEA-JASMINE';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.005 * multiplier);
            END IF;
            -- Sữa tươi: 100ml
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-MILK-FRESH';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.1 * multiplier);
            END IF;
            -- Nước đường: 20ml
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-SUGAR-LIQUID';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.02 * multiplier);
            END IF;

        -- D. NHÓM TRÀ TRÁI CÂY
        ELSIF r.product_slug = 'tra-dao-cam-sa' THEN
            -- Trà đen: 5g
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-TEA-BLACK';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.005 * multiplier);
            END IF;
            -- Cam sành tươi: 100g
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-FRUIT-ORANGE';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.1 * multiplier);
            END IF;
            -- Sả tươi: 20g
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-FRUIT-LEMONGRASS';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.02 * multiplier);
            END IF;
            -- Siro Đào: 20ml
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-SYRUP-PEACH';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.02 * multiplier);
            END IF;

        ELSIF r.product_slug = 'tra-vai-lai' THEN
            -- Trà lài: 5g
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-TEA-JASMINE';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.005 * multiplier);
            END IF;
            -- Siro Vải: 25ml
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-SYRUP-LYCHEE';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.025 * multiplier);
            END IF;

        ELSIF r.product_slug = 'tra-dau-tam-pha-le' THEN
            -- Trà lài: 5g
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-TEA-JASMINE';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.005 * multiplier);
            END IF;
            -- Siro Việt Quất: 20ml
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-SYRUP-BLUEBERRY';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.02 * multiplier);
            END IF;

        ELSIF r.product_slug = 'tra-xoai-nhiet-doi' THEN
            -- Trà lài: 5g
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-TEA-JASMINE';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.005 * multiplier);
            END IF;
            -- Quả xoài cát: 50g
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-FRUIT-MANGO';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.05 * multiplier);
            END IF;

        -- E. NHÓM ĐÁ XAY
        ELSIF r.product_slug = 'chanh-day-tuyet-da-xay' THEN
            -- Siro Chanh Dây: 40ml
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-SYRUP-PASSION';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.04 * multiplier);
            END IF;
            -- Nước đường: 20ml
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-SUGAR-LIQUID';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.02 * multiplier);
            END IF;

        ELSIF r.product_slug = 'cookie-da-xay-kem-beo' THEN
            -- Sữa tươi: 120ml
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-MILK-FRESH';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.12 * multiplier);
            END IF;
            -- Kem béo Rich: 30ml
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-CREAM-RICHS';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.03 * multiplier);
            END IF;
            -- Kẹo dẻo: 1 cái
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-MARSHMALLOW';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 1.0);
            END IF;

        ELSIF r.product_slug = 'matcha-da-xay-kem-phu' THEN
            -- Bột Matcha: 5g
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-TEA-MATCHA';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.005 * multiplier);
            END IF;
            -- Sữa tươi: 120ml
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-MILK-FRESH';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.12 * multiplier);
            END IF;
            -- Kem béo Rich: 30ml
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-CREAM-RICHS';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.03 * multiplier);
            END IF;

        ELSIF r.product_slug = 'ca-phe-caramel-da-xay' THEN
            -- Cà phê Arabica: 18g
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-COFFEE-ARABICA';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.018 * multiplier);
            END IF;
            -- Sữa tươi: 100ml
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-MILK-FRESH';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.1 * multiplier);
            END IF;
            -- Kem béo Rich: 30ml
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-CREAM-RICHS';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.03 * multiplier);
            END IF;

        -- F. NHÓM SINH TỐ
        ELSIF r.product_slug = 'sinh-to-bo-sap-dua' THEN
            -- Quả bơ sáp: 150g
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-FRUIT-AVOCADO';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.15 * multiplier);
            END IF;
            -- Sữa tươi: 80ml
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-MILK-FRESH';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.08 * multiplier);
            END IF;
            -- Sữa đặc: 30ml
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-MILK-CONDENSED';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.03 * multiplier);
            END IF;

        ELSIF r.product_slug = 'sinh-to-dau-sua-chua' THEN
            -- Sữa tươi: 100ml
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-MILK-FRESH';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.1 * multiplier);
            END IF;
            -- Nước đường: 20ml
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-SUGAR-LIQUID';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.02 * multiplier);
            END IF;

        ELSIF r.product_slug = 'sinh-to-xoai-cat' THEN
            -- Quả xoài cát: 150g
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-FRUIT-MANGO';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.15 * multiplier);
            END IF;
            -- Sữa tươi: 80ml
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-MILK-FRESH';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.08 * multiplier);
            END IF;

        ELSIF r.product_slug = 'sinh-to-viet-quat-kem-sua' THEN
            -- Siro Việt Quất: 40ml
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-SYRUP-BLUEBERRY';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.04 * multiplier);
            END IF;
            -- Sữa tươi: 100ml
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-MILK-FRESH';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.1 * multiplier);
            END IF;
            -- Kem béo Rich: 20ml
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-CREAM-RICHS';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.02 * multiplier);
            END IF;

        -- G. NHÓM NƯỚC ÉP
        ELSIF r.product_slug = 'nuoc-ep-cam-tuoi-nguyen-chat' THEN
            -- Quả cam sành: 300g
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-FRUIT-ORANGE';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.3 * multiplier);
            END IF;
            -- Nước đường: 15ml
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-SUGAR-LIQUID';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.015 * multiplier);
            END IF;

        ELSIF r.product_slug = 'nuoc-ep-dua-hau-do' THEN
            -- Quả dưa hấu: 350g
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-FRUIT-WATERMELON';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.35 * multiplier);
            END IF;

        ELSIF r.product_slug = 'nuoc-ep-thom-oi-hong' THEN
            -- Nước đường: 10ml
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-SUGAR-LIQUID';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.01 * multiplier);
            END IF;

        -- H. SỮA CHUA & CACAO
        ELSIF r.product_slug = 'sua-chua-deo-sot-trai-cay' THEN
            -- Sữa tươi: 100ml
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-MILK-FRESH';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.1);
            END IF;
            -- Gelatin: 5g
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-GELATIN';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.005);
            END IF;

        ELSIF r.product_slug = 'cacao-nong-marshmallow' THEN
            -- Bột Cacao: 15g
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-COCOA-POWDER';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.015);
            END IF;
            -- Sữa tươi: 150ml
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-MILK-FRESH';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.15);
            END IF;
            -- Kẹo dẻo: 2 cái
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-MARSHMALLOW';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 2.0);
            END IF;

        ELSIF r.product_slug = 'sua-chua-nep-cam-deo' THEN
            -- Sữa tươi: 100ml
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-MILK-FRESH';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.1);
            END IF;

        -- I. BÁNH NGỌT
        ELSIF r.product_slug = 'banh-tiramisu-y' THEN
            -- Bột mì: 50g
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-FLOUR-11';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.05);
            END IF;
            -- Trứng gà: 1 quả
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-EGG';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 1.0);
            END IF;
            -- Kem phô mai Mascarpone: 50g
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-CHEESE-MASCARPONE';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.05);
            END IF;
            -- Cà phê Arabica: 5g
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-COFFEE-ARABICA';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.005);
            END IF;

        ELSIF r.product_slug = 'banh-red-velvet-nhung-do' THEN
            -- Bột mì: 60g
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-FLOUR-11';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.06);
            END IF;
            -- Trứng gà: 1 quả
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-EGG';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 1.0);
            END IF;
            -- Bơ lạt: 20g
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-BUTTER-ANCHOR';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.02);
            END IF;

        ELSIF r.product_slug = 'banh-cheesecake-chanh-day' THEN
            -- Bột mì: 40g
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-FLOUR-11';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.04);
            END IF;
            -- Kem phô mai Mascarpone: 60g
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-CHEESE-MASCARPONE';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.06);
            END IF;
            -- Siro Chanh dây: 10ml
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-SYRUP-PASSION';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.01);
            END IF;

        ELSIF r.product_slug = 'banh-mousse-dau-tay' THEN
            -- Bột mì: 30g
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-FLOUR-11';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.03);
            END IF;
            -- Gelatin: 3g
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-GELATIN';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.003);
            END IF;

        -- J. BÁNH MÌ & ĐỒ ĂN NHẸ
        ELSIF r.product_slug = 'banh-croissant-bo-toi-phap' THEN
            -- Bột mì: 80g
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-FLOUR-11';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.08);
            END IF;
            -- Bơ lạt: 30g
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-BUTTER-ANCHOR';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.03);
            END IF;

        ELSIF r.product_slug = 'banh-mi-ga-xe-pate-gion' THEN
            -- Bột mì: 100g
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-FLOUR-11';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.1);
            END IF;

        -- K. TRÀ NÓNG
        ELSIF r.product_slug = 'tra-hoa-cuc-mat-ong-am' THEN
            -- Mật ong: 20ml
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-HONEY';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.02);
            END IF;

        ELSIF r.product_slug = 'tra-thao-moc-cung-dinh' THEN
            -- Mật ong: 15ml
            SELECT id INTO curr_ing_id FROM ingredients WHERE sku = 'ING-HONEY';
            IF curr_ing_id IS NOT NULL THEN
                INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES (gen_random_uuid(), curr_recipe_id, curr_ing_id, 0.015);
            END IF;

        END IF;

        RAISE NOTICE '-> Đã đồng bộ công thức: % (Size: %)', r.product_name, COALESCE(r.size_label, 'Mặc định');
    END LOOP;

    RAISE NOTICE '=== ĐỒNG BỘ CÔNG THỨC SẠCH HOÀN TẤT THÀNH CÔNG ===';
END $$;
