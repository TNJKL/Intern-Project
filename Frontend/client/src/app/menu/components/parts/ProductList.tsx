"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import { Product } from "@/types/product";
import { Category } from "@/types/category";
import { ProductCard } from "./ProductCard";

interface ProductListProps {
  products: Product[];
  categories: Category[];
  isLoading: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  isLoadingMore: boolean;
}

export const ProductList = ({
  products,
  categories,
  isLoading,
  hasMore,
  loadMore,
  isLoadingMore
}: ProductListProps) => {
  const [hasScrolled, setHasScrolled] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setHasScrolled(true);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!hasMore || isLoadingMore || isLoading || !hasScrolled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting) {
          loadMore();
        }
      },
      {
        rootMargin: "350px",
      }
    );

    const currentLoader = loaderRef.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [hasMore, isLoadingMore, isLoading, loadMore, hasScrolled]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5 lg:gap-6">
        {products.map((product, index) => (
          <div key={product.id} className="h-full flex flex-col">
            <ProductCard
              product={product}
              index={index}
              categories={categories}
            />
          </div>
        ))}
      </div>

      {/* Loading State Bottom */}
      {hasMore && (
        <div ref={loaderRef} className="py-12 flex flex-col items-center justify-center gap-3 mt-8">
          <Loader2 className="w-7 h-7 sm:w-8 sm:h-8 text-amber-800 animate-spin" />
          {/* TỐI ƯU CHỮ: Tăng từ text-[11px] lên text-xs trên điện thoại, text-sm trên ipad/máy tính */}
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-900/70 animate-pulse text-center px-4">
            Đang tải thêm sản phẩm từ máy chủ...
          </span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && products.length === 0 && (
        <div className="py-20 text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-6 h-6 sm:w-8 sm:h-8 text-amber-800/40" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-1">Không tìm thấy sản phẩm</h3>
          <p className="text-xs sm:text-sm text-gray-500">Vui lòng thử lại với danh mục hoặc từ khóa khác</p>
        </div>
      )}
    </div>
  );
};