import React from 'react';
import type { Product } from '../../../services/product.service';
import type { Category } from '../../../services/category.service';

interface ProductDetailViewProps {
  product: Product;
  categories: Category[];
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({ product, categories }) => {
  const categoryName = categories.find(c => c.id === product.categoryId)?.name || 'N/A';

  // 🎯 ĐÃ SỬA InfoRow: Thay đổi w-36 (cố định) thành cấu hình linh hoạt (sm:w-36)
  // Trên điện thoại, nhãn nằm TRÊN, nội dung nằm DƯỚI (flex-col). Từ Tablet trở lên sẽ nằm ngang (sm:flex-row).
  const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex flex-col sm:flex-row items-start py-3 border-b border-gray-100 last:border-0 gap-1 sm:gap-4">
      <span className="w-full sm:w-36 shrink-0 text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-wide">
        {label}
      </span>
      <span className="flex-1 text-sm font-semibold text-gray-700 w-full break-words">
        {value}
      </span>
    </div>
  );

  return (
    <div className="px-4 sm:px-6 pb-6 space-y-6 max-h-[65vh] sm:max-h-[75vh] overflow-y-auto scrollbar-hide">

      {/* ─── ẢNH + TÊN: ĐÃ SỬA CHỐNG VỠ ─── */}
      {/* Trên mobile: xếp dọc (flex-col), căn giữa. Trên laptop: xếp ngang (sm:flex-row), căn trái */}
      <div className="flex flex-col sm:flex-row gap-5 sm:gap-8 items-center text-center sm:text-left">
        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0 shadow-sm">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-[10px] text-gray-300 font-bold uppercase">No Image</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 w-full">
          {/* Tối ưu font chữ: text-xl trên Mobile, tự phóng to thành text-3xl trên Laptop */}
          <h3 className="text-xl sm:text-3xl font-black text-gray-800 break-words sm:truncate" title={product.name}>
            {product.name}
          </h3>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 font-mono break-all">/{product.slug}</p>

          {/* Badge trạng thái co giãn bao bọc tự động */}
          <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3 sm:mt-4">
            <span className="px-3 sm:px-4 py-1 bg-gray-100 text-gray-600 text-[11px] sm:text-xs font-extrabold rounded-full">
              {categoryName}
            </span>
            <span className={`px-3 sm:px-4 py-1 text-[11px] sm:text-xs font-extrabold rounded-full ${product.isAvailable ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
              }`}>
              {product.isAvailable ? '● Đang bán' : '● Ngừng bán'}
            </span>
            {product.isFeatured && (
              <span className="px-3 sm:px-4 py-1 bg-amber-50 text-amber-700 border border-amber-100 text-[11px] sm:text-xs font-extrabold rounded-full">
                ★ Nổi bật
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ─── THÔNG TIN CHI TIẾT ─── */}
      <div className="bg-gray-50/50 rounded-2xl px-4 py-1 border border-gray-100">
        <InfoRow label="Mô tả" value={product.description || <span className="text-gray-300 italic font-normal">Chưa có mô tả</span>} />
        <InfoRow label="Thứ tự" value={product.displayOrder ?? '—'} />
      </div>

      {/* ─── BIẾN THỂ SIZE & GIÁ: ĐÃ SỬA BẢNG CHỐNG TRÀN VỀ RỘNG ─── */}
      <div>
        <h4 className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Size & Giá</h4>
        {product.variants && product.variants.length > 0 ? (
          // Bọc div overflow-x-auto để bảng nếu có lỡ quá dài trên màn hình siêu nhỏ sẽ tự trượt ngang chứ không phá vỡ khung modal
          <div className="rounded-2xl border border-gray-100 overflow-x-auto bg-white">
            <table className="w-full text-sm min-w-[280px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-3 sm:px-4 py-2.5 text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-wide">Size</th>
                  <th className="text-right px-3 sm:px-4 py-2.5 text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-wide">Giá</th>
                  <th className="text-right px-3 sm:px-4 py-2.5 text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-wide">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {product.variants.map((v, i) => (
                  <tr key={v.id || i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}>
                    <td className="px-3 sm:px-4 py-3 font-bold text-gray-700 text-xs sm:text-sm">{v.sizeLabel}</td>
                    <td className="px-3 sm:px-4 py-3 text-right font-black text-gray-800 text-xs sm:text-sm">
                      {v.price.toLocaleString('vi-VN')}đ
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[11px] font-bold inline-block whitespace-nowrap ${v.isAvailable !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                        }`}>
                        {v.isAvailable !== false ? 'Còn hàng' : 'Hết hàng'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <span className="text-xs text-gray-400">Chưa có cấu hình size</span>
          </div>
        )}
      </div>

      {/* ─── TOppings ĐI KÈM ─── */}
      <div className="pt-2">
        <h4 className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Toppings đi kèm</h4>
        {product.toppings && product.toppings.length > 0 ? (
          // flex-wrap tự động xuống dòng khi các thẻ topping chạm viền điện thoại
          <div className="flex flex-wrap gap-2">
            {product.toppings.map((t: any) => (
              <div key={t.id} className="px-2.5 py-1.5 bg-gray-50 border border-gray-100 rounded-xl flex items-center gap-1.5 max-w-full">
                <span className="text-xs sm:text-sm font-bold text-gray-700 truncate">{t.name}</span>
                <span className="text-[9px] sm:text-[10px] font-black text-[#d37533] shrink-0">+{t.price.toLocaleString()}đ</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <span className="text-xs text-gray-400 italic">Sản phẩm này không có topping đi kèm</span>
          </div>
        )}
      </div>

    </div>
  );
};