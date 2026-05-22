import React from 'react';
import type { Product } from '../../../services/product.service';
import type { Category } from '../../../services/category.service';

interface ProductDetailViewProps {
  product: Product;
  categories: Category[];
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({ product, categories }) => {
  const categoryName = categories.find(c => c.id === product.categoryId)?.name || 'N/A';

  const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex items-start py-3 border-b border-gray-100 last:border-0">
      <span className="w-36 shrink-0 text-xs font-bold text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="flex-1 text-sm font-medium text-gray-700">{value}</span>
    </div>
  );

  return (
    <div className="px-6 pb-6 space-y-6 max-h-[75vh] overflow-y-auto scrollbar-hide">

      {/* ─── ẢNH + TÊN ─── */}
      <div className="flex gap-8 items-center">
        <div className="w-32 h-32 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0 shadow-sm">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-[10px] text-gray-300 font-bold uppercase">No Image</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-3xl font-black text-gray-800 truncate" title={product.name}>{product.name}</h3>
          <p className="text-sm text-gray-400 mt-1 font-mono">/{product.slug}</p>
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="px-4 py-1 bg-gray-100 text-gray-600 text-xs font-extrabold rounded-full">{categoryName}</span>
            <span className={`px-4 py-1 text-xs font-extrabold rounded-full ${
              product.isAvailable ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
            }`}>
              {product.isAvailable ? '● Đang bán' : '● Ngừng bán'}
            </span>
            {product.isFeatured && (
              <span className="px-4 py-1 bg-amber-50 text-amber-700 border border-amber-100 text-xs font-extrabold rounded-full">★ Nổi bật</span>
            )}
          </div>
        </div>
      </div>

      {/* ─── THÔNG TIN CHI TIẾT ─── */}
      <div className="bg-gray-50/50 rounded-2xl px-4 py-1 border border-gray-100">
        <InfoRow label="Mô tả" value={product.description || <span className="text-gray-300 italic">Chưa có mô tả</span>} />
        <InfoRow label="Thứ tự" value={product.displayOrder ?? '—'} />
      </div>

      {/* ─── BIẾN THỂ SIZE & GIÁ ─── */}
      <div>
        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Size & Giá</h4>
        {product.variants && product.variants.length > 0 ? (
          <div className="rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-2.5 text-xs font-black text-gray-400 uppercase tracking-wide">Size</th>
                  <th className="text-right px-4 py-2.5 text-xs font-black text-gray-400 uppercase tracking-wide">Giá</th>
                  <th className="text-right px-4 py-2.5 text-xs font-black text-gray-400 uppercase tracking-wide">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {product.variants.map((v, i) => (
                  <tr key={v.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}>
                    <td className="px-4 py-3 font-bold text-gray-700">{v.sizeLabel}</td>
                    <td className="px-4 py-3 text-right font-black text-gray-800">{v.price.toLocaleString('vi-VN')}đ</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        v.isAvailable !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
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

      {/* ─── TOppings đi kèm ─── */}
      <div className="pt-2">
        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Toppings đi kèm</h4>
        {product.toppings && product.toppings.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {product.toppings.map((t: any) => (
              <div key={t.id} className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-xl flex items-center gap-2">
                <span className="text-sm font-bold text-gray-700">{t.name}</span>
                <span className="text-[10px] font-black text-[#d37533]">+{t.price.toLocaleString()}đ</span>
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
