import React from 'react';
import type { TopProduct } from '../DashboardOverview';

interface TopProductsProps {
  displayTopProducts: TopProduct[];
}

export const TopProducts: React.FC<TopProductsProps> = ({ displayTopProducts }) => {
  return (
    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Sản phẩm bán chạy</h3>
      </div>
      <div className="space-y-1.5">
        {displayTopProducts.length === 0 ? (
          <div className="text-gray-400 text-center font-medium py-8">
            Không có dữ liệu sản phẩm bán chạy
          </div>
        ) : (
          displayTopProducts.slice(0, 5).map((product, index) => {
            let badgeClass = 'text-gray-700 bg-gray-200';
            if (index === 0) badgeClass = 'text-white bg-[#d37533]';
            else if (index === 1) badgeClass = 'text-white bg-gray-500';
            else if (index === 2) badgeClass = 'text-white bg-amber-700';

            return (
              <div key={product.productId} className="flex items-center gap-4 py-1.5 px-3 rounded-2xl hover:bg-gray-50 transition-all duration-200 border border-transparent hover:border-gray-100">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-sm shrink-0 shadow-sm ${badgeClass}`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-extrabold text-gray-900 text-sm tracking-tight truncate" title={product.productName}>
                    {product.productName}
                  </h4>
                  <p className="text-xs text-gray-500 font-semibold mt-0.5">
                    <span className="text-[#d37533] font-bold">{product.quantitySold}</span> đã bán
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
