-- Audit: ai tạo / ai sửa sản phẩm (lưu user id từ JWT, không expose API)
\c product_db;

ALTER TABLE products ADD COLUMN IF NOT EXISTS created_by VARCHAR(128);
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_by VARCHAR(128);

COMMENT ON COLUMN products.created_by IS 'User id từ JWT (JwtUserPrincipal.userId) lúc tạo — chỉ dùng nội bộ / DB';
COMMENT ON COLUMN products.updated_by IS 'User id từ JWT lúc cập nhật gần nhất — chỉ dùng nội bộ / DB';
