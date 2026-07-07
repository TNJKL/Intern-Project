
DO $$
DECLARE
    -- Mảng dữ liệu 12 danh mục sạch
    cat_names text[] := ARRAY[
        'Cà Phê Phin', 'Cà Phê Máy', 'Trà Sữa', 'Trà Trái Cây', 'Đá Xay',
        'Sinh Tố', 'Nước Ép Trái Cây', 'Sữa Chua & Cacao', 'Bánh Ngọt',
        'Bánh Mì & Đồ Ăn Nhẹ', 'Trà Nóng', 'Đồ Uống Đóng Chai'
    ];
    cat_slugs text[] := ARRAY[
        'ca-phe-phin', 'ca-phe-may', 'tra-sua', 'tra-trai-cay', 'da-xay',
        'sinh-to', 'nuoc-ep-trai-cay', 'sua-chua-cacao', 'banh-ngot',
        'banh-mi-do-an-nhe', 'tra-nong', 'do-uong-dong-chai'
    ];
    
    -- Mảng dữ liệu 24 Topping sạch
    top_names text[] := ARRAY[
        'Trân Châu Hoàng Kim', 'Trân Châu Sợi', 'Thạch Sương Sáo', 'Kem Phô Mai (Cheese Foam)', 'Pudding Trứng',
        'Pudding Matcha', 'Hạt Sen', 'Đào Lát Giòn', 'Vải Quả', 'Nhãn Quả',
        'Hạt Chia', 'Thạch Trái Cây', 'Thạch Dừa', 'Nha Đam (Aloe Vera)', 'Kem Mặn Macchiato',
        'Bánh Flan', 'Khúc Bạch Cacao', 'Sương Sa Hạt Lựu', 'Trân Châu Trắng', 'Thạch Cà Phê',
        'Đậu Đỏ Sweet Red Bean', 'Whipped Cream (Kem Béo)', 'Sốt Caramel', 'Sốt Chocolate'
    ];
    top_prices numeric[] := ARRAY[
        10000, 10000, 8000, 12000, 12000,
        12000, 10000, 12000, 10000, 10000,
        5000, 8000, 8000, 8000, 10000,
        15000, 12000, 10000, 10000, 8000,
        10000, 10000, 8000, 8000
    ];
    
    -- Mảng dữ liệu 40 sản phẩm sạch
    prod_names text[] := ARRAY[
        -- 1. Cà Phê Phin (4 món)
        'Cà Phê Đen Đá Phin', 'Cà Phê Sữa Đá Phin', 'Bạc Xỉu Brewtra', 'Cà Phê Trứng Nướng',
        -- 2. Cà Phê Máy (4 món)
        'Cà Phê Espresso', 'Cà Phê Americano', 'Cà Phê Latte Ý', 'Cà Phê Cappuccino',
        -- 3. Trà Sữa (4 món)
        'Trà Sữa Ô Long Brewtra', 'Trà Sữa Matcha Uji', 'Trà Sữa Truyền Thống', 'Trà Sữa Lài Thanh Mát',
        -- 4. Trà Trái Cây (4 món)
        'Trà Đào Cam Sả', 'Trà Vải Lài', 'Trà Dâu Tằm Pha Lê', 'Trà Xoài Nhiệt Đới',
        -- 5. Đá Xay (4 món)
        'Chanh Dây Tuyết Đá Xay', 'Cookie Đá Xay Kem Béo', 'Matcha Đá Xay Kem Phủ', 'Cà Phê Caramel Đá Xay',
        -- 6. Sinh Tố (4 món)
        'Sinh Tố Bơ Sáp Dừa', 'Sinh Tố Dâu Sữa Chua', 'Sinh Tố Xoài Cát', 'Sinh Tố Việt Quất Kem Sữa',
        -- 7. Nước Ép Trái Cây (3 món)
        'Nước Ép Cam Tươi Nguyên Chất', 'Nước Ép Dưa Hấu Đỏ', 'Nước Ép Thơm Ổi Hồng',
        -- 8. Sữa Chua & Cacao (3 món)
        'Sữa Chua Dẻo Sốt Trái Cây', 'Cacao Nóng Marshmallow', 'Sữa Chua Nếp Cẩm Dẻo',
        -- 9. Bánh Ngọt (4 món)
        'Bánh Tiramisu Ý', 'Bánh Red Velvet Nhung Đỏ', 'Bánh Cheesecake Chanh Dây', 'Bánh Mousse Dâu Tây',
        -- 10. Bánh Mì & Đồ Ăn Nhẹ (2 món)
        'Bánh Croissant Bơ Tỏi Pháp', 'Bánh Mì Gà Xé Pate Giòn',
        -- 11. Trà Nóng (2 món)
        'Trà Hoa Cúc Mật Ong Ấm', 'Trà Thảo Mộc Cung Đình',
        -- 12. Đồ Uống Đóng Chai (2 món)
        'Nước Khoáng Dasani Chai', 'Nước Ép Trái Cây Đóng Chai Rauch'
    ];
    prod_slugs text[] := ARRAY[
        -- 1. Cà Phê Phin
        'ca-phe-den-da-phin', 'ca-phe-sua-da-phin', 'bac-xiu-brewtra', 'ca-phe-trung-nuong',
        -- 2. Cà Phê Máy
        'ca-phe-espresso', 'ca-phe-americano', 'ca-phe-latte-y', 'ca-phe-cappuccino',
        -- 3. Trà Sữa
        'tra-sua-o-long-brewtra', 'tra-sua-matcha-uji', 'tra-sua-truyen-thong', 'tra-sua-lai-thanh-mat',
        -- 4. Trà Trái Cây
        'tra-dao-cam-sa', 'tra-vai-lai', 'tra-dau-tam-pha-le', 'tra-xoai-nhiet-doi',
        -- 5. Đá Xay
        'chanh-day-tuyet-da-xay', 'cookie-da-xay-kem-beo', 'matcha-da-xay-kem-phu', 'ca-phe-caramel-da-xay',
        -- 6. Sinh Tố
        'sinh-to-bo-sap-dua', 'sinh-to-dau-sua-chua', 'sinh-to-xoai-cat', 'sinh-to-viet-quat-kem-sua',
        -- 7. Nước Ép Trái Cây
        'nuoc-ep-cam-tuoi-nguyen-chat', 'nuoc-ep-dua-hau-do', 'nuoc-ep-thom-oi-hong',
        -- 8. Sữa Chua & Cacao
        'sua-chua-deo-sot-trai-cay', 'cacao-nong-marshmallow', 'sua-chua-nep-cam-deo',
        -- 9. Bánh Ngọt
        'banh-tiramisu-y', 'banh-red-velvet-nhung-do', 'banh-cheesecake-chanh-day', 'banh-mousse-dau-tay',
        -- 10. Bánh Mì & Đồ Ăn Nhẹ
        'banh-croissant-bo-toi-phap', 'banh-mi-ga-xe-pate-gion',
        -- 11. Trà Nóng
        'tra-hoa-cuc-mat-ong-am', 'tra-thao-moc-cung-dinh',
        -- 12. Đồ Uống Đóng Chai
        'nuoc-khoang-dasani-chai', 'nuoc-ep-trai-cay-dong-chai-rauch'
    ];
    prod_descs text[] := ARRAY[
        -- 1. Cà Phê Phin
        'Cà phê Robusta Đắk Lắk pha phin truyền thống, đậm đà, hậu vị đắng ngọt nguyên bản.',
        'Sự kết hợp giữa cà phê phin đậm đặc và sữa đặc béo ngậy truyền thống Việt Nam.',
        'Thức uống ngọt ngào kết hợp nhiều sữa tươi béo ngậy, sữa đặc và một chút cà phê phin thơm nhẹ.',
        'Cà phê phin đậm đà kết hợp với lớp kem trứng đánh bông béo ngậy nướng thơm nhẹ.',
        -- 2. Cà Phê Máy
        'Hương vị cà phê đậm đặc chiết xuất bằng áp suất máy chuẩn vị Ý.',
        'Sự kết hợp nhẹ nhàng giữa Espresso và nước nóng thanh tao, dễ uống.',
        'Sự kết hợp tinh tế giữa một shot Espresso chuẩn vị và sữa tươi đánh bọt mịn màng.',
        'Sự cân bằng hoàn hảo giữa Espresso, sữa nóng và lớp bọt sữa dày mịn rắc bột cacao.',
        -- 3. Trà Sữa
        'Trà sữa đậm đà pha từ trà ô long hảo hạng, thơm béo vị sữa đặc trưng.',
        'Sự kết hợp hoàn hảo giữa bột matcha Uji Nhật Bản thơm nồng và cốt trà sữa béo ngậy.',
        'Trà sữa hồng trà cổ điển thơm hương trà đen, ngậy vị sữa truyền thống.',
        'Sự kết hợp giữa cốt trà lài thơm hoa cỏ thanh khiết và sữa béo ngọt dịu.',
        -- 4. Trà Trái Cây
        'Trà đen thơm ngát hòa quyện nước cam tươi chua ngọt, hương sả ấm áp và đào lát giòn.',
        'Trà lài thanh khiết, thơm hoa nhài kết hợp quả vải ngâm ngọt mọng nước.',
        'Nước cốt dâu tằm chua ngọt hòa quyện cùng trà lài thanh nhẹ và trân châu trắng dai giòn.',
        'Trà xanh nhài kết hợp mứt xoài tươi chín mọng ngọt lịm thơm mát.',
        -- 5. Đá Xay
        'Chanh dây tươi chua ngọt xay tuyết đá mát lạnh, đánh tan cái nắng.',
        'Bánh oreo xay mịn với sữa tươi, đá viên và phủ một lớp kem whip béo ngậy.',
        'Bột matcha Nhật Bản xay tuyết mát lạnh phủ kem tươi bông xốp béo ngậy.',
        'Espresso đậm đà xay đá tuyết thơm ngậy hương caramel và phủ kem béo.',
        -- 6. Sinh Tố
        'Bơ sáp béo ngậy xay mịn kết hợp nước cốt dừa thơm phức, mát lành.',
        'Dâu tây tươi chua ngọt kết hợp sữa chua lên men tự nhiên bổ dưỡng.',
        'Xoài cát chín thơm lừng xay nhuyễn mịn màng ngọt lịm tự nhiên.',
        'Quả việt quất chua ngọt thơm đậm đà xay mịn phủ lớp kem sữa béo.',
        -- 7. Nước Ép Trái Cây
        'Cam sành vắt nguyên chất giàu vitamin C tự nhiên thơm ngọt thanh mát.',
        'Dưa hấu chín đỏ mọng nước ép lạnh ngọt lành tự nhiên giải nhiệt tức thì.',
        'Sự kết hợp thơm mát giữa quả thơm mật ngọt và ổi xá lị hồng thơm dịu.',
        -- 8. Sữa Chua & Cacao
        'Sữa chua dẻo cắt miếng mịn màng rưới mứt dâu tây/xoài chua ngọt thơm ngon.',
        'Cacao nguyên chất pha sữa nóng đậm đà phủ kẹo xốp marshmallow ngọt ngào.',
        'Sữa chua mát lạnh kết hợp nếp cẩm nấu lá dứa dẻo bùi thơm phức.',
        -- 9. Bánh Ngọt
        'Lớp kem mascarpone béo ngậy xen kẽ cốt bánh ngấm vị rượu rum và cà phê Espresso.',
        'Cốt bánh đỏ nhung ẩm mịn, xen kẽ các lớp kem cheese chua nhẹ béo ngậy.',
        'Phô mai nướng đậm đà, ngậy béo phủ lớp sốt chanh dây chua ngọt thanh mát.',
        'Lớp mousse kem tươi vị dâu tây ngọt nhẹ xốp mịn tan chảy trong miệng.',
        -- 10. Bánh Mì & Đồ Ăn Nhẹ
        'Bánh sừng bò ngàn lớp nướng giòn rụm bên ngoài, ngập bơ tỏi thơm lừng.',
        'Bánh mì Việt Nam kẹp gà xé cay, pate bơ truyền thống giòn rụm đậm đà.',
        -- 11. Trà Nóng
        'Ấm trà hoa cúc sấy khô pha mật ong thanh mát giải nhiệt thư thái đầu óc.',
        'Ấm trà thảo mộc kết hợp kỷ tử, táo đỏ, nhãn nhục, hạt sen tốt cho sức khỏe.',
        -- 12. Đồ Uống Đóng Chai
        'Nước uống tinh khiết đóng chai Dasani mát lành giải khát tiện lợi.',
        'Nước ép trái cây nhập khẩu đóng chai thủy tinh cao cấp thơm ngon nguyên chất.'
    ];
    -- Phân nhóm danh mục sản phẩm (1-Cà Phê Phin, 2-Cà Phê Máy, 3-Trà Sữa, 4-Trà Trái Cây, 5-Đá Xay, 6-Sinh Tố, 7-Nước Ép, 8-Sữa Chua, 9-Bánh Ngọt, 10-Đồ Ăn Nhẹ, 11-Trà Nóng, 12-Chai)
    prod_cat_indices int[] := ARRAY[
        1, 1, 1, 1,
        2, 2, 2, 2,
        3, 3, 3, 3,
        4, 4, 4, 4,
        5, 5, 5, 5,
        6, 6, 6, 6,
        7, 7, 7,
        8, 8, 8,
        9, 9, 9, 9,
        10, 10,
        11, 11,
        12, 12
    ];
    prod_prices numeric[] := ARRAY[
        29000, 32000, 35000, 45000,
        35000, 35000, 45000, 45000,
        39000, 45000, 35000, 39000,
        45000, 42000, 45000, 45000,
        45000, 49000, 55000, 55000,
        49000, 49000, 45000, 52000,
        39000, 39000, 42000,
        39000, 39000, 35000,
        39000, 42000, 42000, 39000,
        35000, 39000,
        49000, 55000,
        20000, 25000
    ];

    -- Cấu hình phân chia size (TRUE: chia 3 size S/M/L; FALSE: chỉ dùng size mặc định NULL)
    prod_has_sizes boolean[] := ARRAY[
        -- 1. Cà Phê Phin
        TRUE, TRUE, TRUE, FALSE,
        -- 2. Cà Phê Máy
        FALSE, FALSE, TRUE, TRUE,
        -- 3. Trà Sữa
        TRUE, TRUE, TRUE, TRUE,
        -- 4. Trà Trái Cây
        TRUE, TRUE, TRUE, TRUE,
        -- 5. Đá Xay
        TRUE, TRUE, TRUE, TRUE,
        -- 6. Sinh Tố
        TRUE, TRUE, TRUE, TRUE,
        -- 7. Nước Ép Trái Cây
        TRUE, TRUE, TRUE,
        -- 8. Sữa Chua & Cacao
        FALSE, FALSE, FALSE,
        -- 9. Bánh Ngọt
        FALSE, FALSE, FALSE, FALSE,
        -- 10. Bánh Mì & Đồ Ăn Nhẹ
        FALSE, FALSE,
        -- 11. Trà Nóng
        FALSE, FALSE,
        -- 12. Đồ Uống Đóng Chai
        FALSE, FALSE
    ];

    -- Biến hỗ trợ vòng lặp
    r RECORD;
    i int;
    total_cats int;
    total_toppings int;
    total_prods int;
    
    -- Các biến lưu ID tạm
    curr_cat_id UUID;
    curr_prod_id UUID;
    curr_top_id UUID;
    cat_ids_map UUID[]; -- Bản đồ lưu UUID của danh mục sạch trong DB
BEGIN
    RAISE NOTICE '=== BẮT ĐẦU ĐỒNG BỘ DỮ LIỆU SẠCH (BÌNH CŨ RƯỢU MỚI) ===';

    -- ============================================================
    -- GIẢI PHÓNG UNIQUE CONSTRAINT CHO SLUG
    -- ============================================================
    UPDATE categories SET slug = id::text WHERE deleted_at IS NULL;
    UPDATE products SET slug = id::text WHERE deleted_at IS NULL;

    -- ============================================================
    -- 1. ĐỒNG BỘ CATEGORIES (DANH MỤC)
    -- ============================================================
    total_cats := array_length(cat_names, 1);
    i := 1;
    cat_ids_map := ARRAY[]::UUID[];

    FOR r IN (SELECT id FROM categories WHERE deleted_at IS NULL ORDER BY created_at ASC) LOOP
        IF i <= total_cats THEN
            -- UPDATE danh mục cũ thành danh mục sạch tương ứng
            UPDATE categories 
            SET name = cat_names[i],
                slug = cat_slugs[i],
                display_order = i,
                is_active = TRUE,
                updated_at = NOW()
            WHERE id = r.id;
            
            cat_ids_map := array_append(cat_ids_map, r.id);
            RAISE NOTICE '-> Cập nhật Category ID % thành: %', r.id, cat_names[i];
            i := i + 1;
        ELSE
            -- Ẩn danh mục dư thừa (Soft Delete) để bảo toàn đơn hàng
            UPDATE categories 
            SET is_active = FALSE,
                deleted_at = NOW(),
                updated_at = NOW()
            WHERE id = r.id;
            RAISE NOTICE '-> Ẩn Category thừa ID %', r.id;
        END IF;
    END LOOP;

    -- Nếu số danh mục cũ ít hơn danh mục sạch, tự động chèn thêm
    WHILE i <= total_cats LOOP
        INSERT INTO categories (id, name, slug, display_order, is_active, created_at, updated_at)
        VALUES (gen_random_uuid(), cat_names[i], cat_slugs[i], i, TRUE, NOW(), NOW())
        RETURNING id INTO curr_cat_id;
        
        cat_ids_map := array_append(cat_ids_map, curr_cat_id);
        RAISE NOTICE '-> Chèn thêm Category mới: %', cat_names[i];
        i := i + 1;
    END LOOP;

    -- ============================================================
    -- 2. ĐỒNG BỘ TOPPINGS (ĐỒ ĂN KÈM)
    -- ============================================================
    total_toppings := array_length(top_names, 1);
    i := 1;
    
    FOR r IN (SELECT id FROM toppings WHERE deleted_at IS NULL ORDER BY created_at ASC) LOOP
        IF i <= total_toppings THEN
            -- UPDATE topping cũ
            UPDATE toppings
            SET name = top_names[i],
                price = top_prices[i],
                display_order = i,
                is_available = TRUE,
                updated_at = NOW()
            WHERE id = r.id;
            RAISE NOTICE '-> Cập nhật Topping ID % thành: % (Giá %đ)', r.id, top_names[i], top_prices[i];
            i := i + 1;
        ELSE
            -- Ẩn topping dư thừa
            UPDATE toppings
            SET is_available = FALSE,
                deleted_at = NOW(),
                updated_at = NOW()
            WHERE id = r.id;
            RAISE NOTICE '-> Ẩn Topping thừa ID %', r.id;
        END IF;
    END LOOP;

    -- Nếu thiếu topping sạch, tự động chèn thêm
    WHILE i <= total_toppings LOOP
        INSERT INTO toppings (id, name, price, display_order, is_available, created_at, updated_at)
        VALUES (gen_random_uuid(), top_names[i], top_prices[i], i, TRUE, NOW(), NOW());
        RAISE NOTICE '-> Chèn thêm Topping mới: %', top_names[i];
        i := i + 1;
    END LOOP;

    -- ============================================================
    -- 3. ĐỒNG BỘ PRODUCTS (SẢN PHẨM) & VARIANTS (BẢNG GIÁ)
    -- ============================================================
    total_prods := array_length(prod_names, 1);
    i := 1;

    FOR r IN (SELECT id FROM products WHERE deleted_at IS NULL ORDER BY created_at ASC) LOOP
        IF i <= total_prods THEN
            -- Tìm ID danh mục tương ứng
            curr_cat_id := cat_ids_map[prod_cat_indices[i]];
            
            -- UPDATE sản phẩm cũ sang thông tin sạch mới
            UPDATE products
            SET category_id = curr_cat_id,
                name = prod_names[i],
                slug = prod_slugs[i],
                description = prod_descs[i],
                is_available = TRUE,
                display_order = i,
                updated_at = NOW()
            WHERE id = r.id;

            -- Dọn dẹp variants giá cũ của sản phẩm này
            DELETE FROM product_variants WHERE product_id = r.id;
            
            -- Phân nhánh chèn Variants theo kích cỡ cấu hình
            IF prod_has_sizes[i] THEN
                -- Chèn Size S (Giá cơ bản)
                INSERT INTO product_variants (id, product_id, size_label, price, is_available, display_order)
                VALUES (gen_random_uuid(), r.id, 'S', prod_prices[i], TRUE, 1);
                
                -- Chèn Size M (Giá cơ bản + 5000)
                INSERT INTO product_variants (id, product_id, size_label, price, is_available, display_order)
                VALUES (gen_random_uuid(), r.id, 'M', prod_prices[i] + 5000, TRUE, 2);
                
                -- Chèn Size L (Giá cơ bản + 10000)
                INSERT INTO product_variants (id, product_id, size_label, price, is_available, display_order)
                VALUES (gen_random_uuid(), r.id, 'L', prod_prices[i] + 10000, TRUE, 3);
                
                RAISE NOTICE '-> Cập nhật Product ID % thành: % (3 Size S/M/L, Giá gốc %đ)', r.id, prod_names[i], prod_prices[i];
            ELSE
                -- Chèn Size mặc định (size_label = NULL)
                INSERT INTO product_variants (id, product_id, size_label, price, is_available, display_order)
                VALUES (gen_random_uuid(), r.id, NULL, prod_prices[i], TRUE, 1);
                
                RAISE NOTICE '-> Cập nhật Product ID % thành: % (Size Mặc định, Giá %đ)', r.id, prod_names[i], prod_prices[i];
            END IF;
            
            i := i + 1;
        ELSE
            -- Ẩn sản phẩm dư thừa khỏi website (Soft Delete)
            UPDATE products
            SET is_available = FALSE,
                deleted_at = NOW(),
                updated_at = NOW()
            WHERE id = r.id;
            
            -- Ẩn variants đi kèm
            UPDATE product_variants
            SET is_available = FALSE,
                deleted_at = NOW()
            WHERE product_id = r.id;

            RAISE NOTICE '-> Ẩn Product thừa ID %', r.id;
        END IF;
    END LOOP;

    -- Nếu thiếu sản phẩm sạch, tự động chèn thêm
    WHILE i <= total_prods LOOP
        curr_cat_id := cat_ids_map[prod_cat_indices[i]];
        
        INSERT INTO products (id, category_id, name, slug, description, is_available, is_featured, display_order, created_at, updated_at)
        VALUES (gen_random_uuid(), curr_cat_id, prod_names[i], prod_slugs[i], prod_descs[i], TRUE, FALSE, i, NOW(), NOW())
        RETURNING id INTO curr_prod_id;

        -- Phân nhánh chèn Variants cho sản phẩm chèn mới
        IF prod_has_sizes[i] THEN
            -- Chèn Size S (Giá cơ bản)
            INSERT INTO product_variants (id, product_id, size_label, price, is_available, display_order)
            VALUES (gen_random_uuid(), curr_prod_id, 'S', prod_prices[i], TRUE, 1);
            
            -- Chèn Size M (Giá cơ bản + 5000)
            INSERT INTO product_variants (id, product_id, size_label, price, is_available, display_order)
            VALUES (gen_random_uuid(), curr_prod_id, 'M', prod_prices[i] + 5000, TRUE, 2);
            
            -- Chèn Size L (Giá cơ bản + 10000)
            INSERT INTO product_variants (id, product_id, size_label, price, is_available, display_order)
            VALUES (gen_random_uuid(), curr_prod_id, 'L', prod_prices[i] + 10000, TRUE, 3);
            
            RAISE NOTICE '-> Chèn thêm Product mới: % (3 Size S/M/L, Giá gốc %đ)', prod_names[i], prod_prices[i];
        ELSE
            -- Chèn Size mặc định (size_label = NULL)
            INSERT INTO product_variants (id, product_id, size_label, price, is_available, display_order)
            VALUES (gen_random_uuid(), curr_prod_id, NULL, prod_prices[i], TRUE, 1);
            
            RAISE NOTICE '-> Chèn thêm Product mới: % (Size Mặc định, Giá %đ)', prod_names[i], prod_prices[i];
        END IF;

        i := i + 1;
    END LOOP;

    RAISE NOTICE '=== ĐỒNG BỘ DỮ LIỆU SẠCH HOÀN TẤT AN TOÀN ===';
END $$;
