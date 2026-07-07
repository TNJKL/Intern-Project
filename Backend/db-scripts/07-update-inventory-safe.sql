DO $$
DECLARE
    -- Mảng dữ liệu 30 nguyên liệu sạch
    ing_names text[] := ARRAY[
        'Cà phê hạt Robusta Đắk Lắk', 'Cà phê hạt Arabica Cầu Đất', 'Bột Ca cao nguyên chất',
        'Trà đen thượng hạng', 'Trà lài thanh khiết', 'Trà Ô Long hảo hạng', 'Bột Matcha Uji Nhật Bản',
        'Sữa tươi tiệt trùng Vinamilk', 'Sữa đặc có đường Ông Thọ', 'Kem béo thực vật Rich''s',
        'Kem phô mai Mascarpone', 'Bơ lạt Anchor', 'Đường cát trắng', 'Nước đường pha chế',
        'Mật ong hoa nhãn nguyên chất', 'Siro Đào Golden Farm', 'Siro Vải Golden Farm',
        'Siro Chanh Dây Golden Farm', 'Siro Việt Quất Golden Farm', 'Siro Bạc Hà Golden Farm',
        'Cam sành tươi', 'Dưa hấu đỏ', 'Sả cây tươi', 'Chanh không hạt', 'Quả bơ sáp Đắk Lắk',
        'Quả xoài cát Hòa Lộc', 'Bột mì số 11', 'Trứng gà tươi Ba Huân', 'Kẹo xốp Marshmallow', 'Bột gelatin Pháp'
    ];
    ing_skus text[] := ARRAY[
        'ING-COFFEE-ROBUSTA', 'ING-COFFEE-ARABICA', 'ING-COCOA-POWDER',
        'ING-TEA-BLACK', 'ING-TEA-JASMINE', 'ING-TEA-OOLONG', 'ING-TEA-MATCHA',
        'ING-MILK-FRESH', 'ING-MILK-CONDENSED', 'ING-CREAM-RICHS',
        'ING-CHEESE-MASCARPONE', 'ING-BUTTER-ANCHOR', 'ING-SUGAR-WHITE', 'ING-SUGAR-LIQUID',
        'ING-HONEY', 'ING-SYRUP-PEACH', 'ING-SYRUP-LYCHEE',
        'ING-SYRUP-PASSION', 'ING-SYRUP-BLUEBERRY', 'ING-SYRUP-MINT',
        'ING-FRUIT-ORANGE', 'ING-FRUIT-WATERMELON', 'ING-FRUIT-LEMONGRASS', 'ING-FRUIT-LIME', 'ING-FRUIT-AVOCADO',
        'ING-FRUIT-MANGO', 'ING-FLOUR-11', 'ING-EGG', 'ING-MARSHMALLOW', 'ING-GELATIN'
    ];
    ing_units text[] := ARRAY[
        'kg', 'kg', 'kg',
        'kg', 'kg', 'kg', 'kg',
        'lít', 'hộp', 'hộp',
        'hộp', 'kg', 'kg', 'lít',
        'lít', 'chai', 'chai',
        'chai', 'chai', 'chai',
        'kg', 'kg', 'kg', 'kg', 'kg',
        'kg', 'kg', 'quả', 'gói', 'kg'
    ];
    ing_prices numeric[] := ARRAY[
        150000, 250000, 180000,
        200000, 220000, 240000, 650000,
        30000, 22000, 28000,
        95000, 220000, 20000, 25000,
        180000, 120000, 120000,
        95000, 140000, 110000,
        25000, 15000, 18000, 30000, 45000,
        35000, 22000, 3000, 35000, 350000
    ];
    ing_low_stocks numeric[] := ARRAY[
        5.0, 3.0, 2.0,
        2.0, 2.0, 2.0, 1.0,
        10.0, 12.0, 10.0,
        3.0, 2.0, 10.0, 5.0,
        2.0, 3.0, 3.0,
        3.0, 3.0, 3.0,
        10.0, 15.0, 3.0, 5.0, 8.0,
        8.0, 5.0, 30.0, 2.0, 1.0
    ];

    r RECORD;
    i int;
    total_ings int;
BEGIN
    RAISE NOTICE '=== BẮT ĐẦU ĐỒNG BỘ NGUYÊN LIỆU SẠCH (LOẠI TRỪ TOPPINGS) ===';

    -- 1. Giải phóng Unique Constraint của các SKU cũ (chỉ những dòng KHÔNG PHẢI TOPPING)
    -- Gán tạm thời sku = id của chính nó để tránh trùng lặp khi UPDATE.
    UPDATE ingredients 
    SET sku = id::text 
    WHERE sku NOT LIKE 'TOPPING%';

    -- 2. Duyệt qua toàn bộ các nguyên liệu cũ (NOT LIKE 'TOPPING%')
    total_ings := array_length(ing_names, 1);
    i := 1;

    FOR r IN (SELECT id FROM ingredients WHERE sku NOT LIKE 'TOPPING%' ORDER BY created_at ASC) LOOP
        IF i <= total_ings THEN
            -- UPDATE nguyên liệu cũ thành nguyên liệu sạch mới
            UPDATE ingredients
            SET name = ing_names[i],
                sku = ing_skus[i],
                unit = ing_units[i],
                cost_per_unit = ing_prices[i],
                low_stock_threshold = ing_low_stocks[i],
                is_active = TRUE,
                updated_at = NOW()
            WHERE id = r.id;
            
            RAISE NOTICE '-> Cập nhật Ingredient ID % thành: % (SKU: %, Đơn vị: %)', r.id, ing_names[i], ing_skus[i], ing_units[i];
            i := i + 1;
        ELSE
            -- Ẩn các nguyên liệu dư thừa
            -- Gán mã SKU tạm thời để giải phóng SKU gốc
            UPDATE ingredients
            SET is_active = FALSE,
                sku = 'temp-inactive-' || id::text,
                updated_at = NOW()
            WHERE id = r.id;
            
            RAISE NOTICE '-> Ẩn Ingredient thừa ID %', r.id;
        END IF;
    END LOOP;

    -- 3. Nếu số lượng nguyên liệu cũ ít hơn 30, tự động chèn thêm
    WHILE i <= total_ings LOOP
        INSERT INTO ingredients (id, name, sku, unit, current_stock, low_stock_threshold, cost_per_unit, is_active, created_at, updated_at)
        VALUES (gen_random_uuid(), ing_names[i], ing_skus[i], ing_units[i], 0, ing_low_stocks[i], ing_prices[i], TRUE, NOW(), NOW());
        
        RAISE NOTICE '-> Chèn thêm Ingredient mới: % (SKU: %)', ing_names[i], ing_skus[i];
        i := i + 1;
    END LOOP;

    RAISE NOTICE '=== ĐỒNG BỘ NGUYÊN LIỆU HOÀN TẤT AN TOÀN ===';
END $$;
