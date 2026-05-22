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

  // Lắng nghe sự kiện cuộn lần đầu để kích hoạt Infinite Scroll (chống tự động tải hết khi mới vào trang)
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setHasScrolled(true);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []); // Chỉ chạy 1 lần duy nhất khi mount - không bị reset khi products thay đổi!

  // Thiết lập IntersectionObserver để cuộn chạm đáy -> Tự động tải thêm sản phẩm (chuẩn Facebook)
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
        rootMargin: "350px", // Phản hồi cực nhanh khi người dùng cuộn cách đáy 350px
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
    <div className="max-w-7xl mx-auto px-4 mt-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
        {products.map((product, index) => (
          <ProductCard 
            key={product.id} 
            product={product} 
            index={index} 
            categories={categories} 
          />
        ))}
      </div>

      {/* Hiển thị vòng xoay loading khi cuộn và truy vấn DB */}
      {hasMore && (
        <div ref={loaderRef} className="py-12 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span className="text-[10px] font-black uppercase tracking-widest text-primary/60 animate-pulse">
            Đang tải thêm sản phẩm từ máy chủ...
          </span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && products.length === 0 && (
        <div className="py-20 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Không tìm thấy sản phẩm</h3>
          <p className="text-gray-500">Vui lòng thử lại với danh mục hoặc từ khóa khác</p>
        </div>
      )}
    </div>
  );
};
