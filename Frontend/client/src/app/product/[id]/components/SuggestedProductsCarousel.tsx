"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Coffee, Star, ShoppingCart, Flame, ChevronLeft, ChevronRight } from "lucide-react";
import { SafeImage } from "@/components/SafeImage";
import { Product, ProductVariant } from "@/types/product";

interface SuggestedProductsCarouselProps {
  products: Product[];
  categories: any[];
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("vi-VN").format(price);
};

export default function SuggestedProductsCarousel({
  products,
  categories,
}: SuggestedProductsCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Helper to calculate exact step width (1 card width + gap)
  const getScrollStep = () => {
    const container = scrollContainerRef.current;
    if (!container) return 0;
    const firstCard = container.querySelector(".group");
    if (firstCard) {
      const cardWidth = firstCard.clientWidth;
      const style = window.getComputedStyle(container);
      const gap = parseInt(style.columnGap || "20px", 10) || 20;
      return cardWidth + gap;
    }
    return container.clientWidth / 5;
  };

  const handleNext = React.useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const step = getScrollStep();
    const maxScroll = container.scrollWidth - container.clientWidth;
    if (container.scrollLeft >= maxScroll - 15) {
      container.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      container.scrollTo({ left: container.scrollLeft + step, behavior: "smooth" });
    }
  }, []);

  const handlePrev = React.useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const step = getScrollStep();
    if (container.scrollLeft <= 15) {
      const maxScroll = container.scrollWidth - container.clientWidth;
      container.scrollTo({ left: maxScroll, behavior: "smooth" });
    } else {
      container.scrollTo({ left: container.scrollLeft - step, behavior: "smooth" });
    }
  }, []);

  // Auto-scroll logic (pauses on hover)
  useEffect(() => {
    if (isHovered || products.length <= 1) return;

    const interval = setInterval(() => {
      handleNext();
    }, 3500);

    return () => clearInterval(interval);
  }, [isHovered, products.length, handleNext]);

  if (!products || products.length === 0) {
    return (
      <div className="border-t border-gray-200 pt-10 mt-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-red-100 rounded text-red-600">
              <Coffee size={20} className="text-red-600 animate-pulse" />
            </div>
            <h2 className="text-lg font-extrabold text-gray-900 uppercase tracking-tight">
              Sản phẩm gợi ý cho bạn
            </h2>
          </div>
          <Link href="/menu" className="text-xs font-bold text-[#4d362b] hover:underline">
            Xem tất cả
          </Link>
        </div>
        <div className="py-10 text-center border border-dashed border-gray-200 rounded-2xl">
          <Coffee className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Chưa có sản phẩm đề xuất nào.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200 pt-10 mt-10">
      {/* Header section with Title and Nav buttons */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-red-100 rounded text-red-600">
            <Flame size={20} className="fill-red-600 animate-pulse" />
          </div>
          <h2 className="text-lg font-extrabold text-gray-900 uppercase tracking-tight">
            Sản phẩm gợi ý cho bạn
          </h2>
        </div>

        <div className="flex items-center gap-4">
          {/* Custom Nav buttons */}
          <div className="hidden sm:flex items-center gap-1.5 pr-2.5 border-r border-gray-200">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-stone-50 hover:border-gray-300 text-[#4d362b] transition-all duration-200 active:scale-95 shadow-sm flex items-center justify-center cursor-pointer"
              title="Xem sản phẩm trước"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-stone-50 hover:border-gray-300 text-[#4d362b] transition-all duration-200 active:scale-95 shadow-sm flex items-center justify-center cursor-pointer"
              title="Xem sản phẩm kế tiếp"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <Link href="/menu" className="text-xs font-bold text-[#4d362b] hover:underline">
            Xem tất cả
          </Link>
        </div>
      </div>

      {/* Horizontal scrolling slider container */}
      <div
        ref={scrollContainerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="flex overflow-x-auto gap-4 md:gap-5 pb-6 select-none no-scrollbar"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {products.map((item: any) => {
          const minItemPrice = item.variants && item.variants.length > 0
            ? Math.min(...item.variants.map((v: ProductVariant) => v.price))
            : item.price || 0;
          const categoryName = categories.find((c: any) => c.id === item.categoryId)?.name || "Nổi bật";

          return (
            <div
              key={item.id}
              className="group bg-[#fdf3eb] p-4 rounded-[24px] border border-transparent hover:border-[#4d362b]/5 hover:shadow-[0_10px_30px_-10px_rgba(60,42,33,0.08)] transition-all duration-300 flex flex-col justify-between shrink-0 w-[calc((100%-16px)/2)] sm:w-[calc((100%-32px)/3)] md:w-[calc((100%-60px)/4)] xl:w-[calc((100%-80px)/5)] h-auto select-none"
            >
              <Link href={`/product/${item.id}`} className="flex flex-col h-full w-full min-w-0">
                {/* Image area */}
                <div className="relative aspect-square mb-3 rounded-2xl overflow-hidden bg-white flex items-center justify-center shrink-0 border border-gray-50 w-full">
                  <SafeImage
                    src={item.imageUrl || ""}
                    alt={item.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                    className="object-contain p-2 group-hover:scale-110 transition-transform duration-700"
                    fallback={
                      <div className="flex flex-col items-center justify-center text-gray-300">
                        <Coffee className="w-8 h-8 mb-1" />
                        <span className="text-[8px] font-black tracking-widest">No Image</span>
                      </div>
                    }
                  />
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded-lg flex items-center gap-0.5 border border-black/5 shadow-sm">
                    <Star className="w-2.5 h-2.5 text-orange-400 fill-current" />
                    <span className="text-[9px] font-black">4.9</span>
                  </div>
                </div>

                {/* Text content */}
                <div className="flex-1 flex flex-col justify-between min-w-0 space-y-1">
                  <div className="min-w-0">
                    <p className="text-[9px] text-[#4d362b]/60 font-black uppercase tracking-widest truncate">
                      {categoryName}
                    </p>
                    <h3 className="font-black text-gray-800 group-hover:text-[#4d362b] transition-colors truncate uppercase text-xs md:text-sm">
                      {item.name}
                    </h3>
                    <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed pt-0.5">
                      {item.description || "Hương vị nguyên bản đậm đà."}
                    </p>
                  </div>

                  {/* Price & Cart icon */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100/50 mt-auto min-w-0">
                    <span className="font-black text-[#4d362b] text-xs sm:text-sm whitespace-nowrap truncate pr-1">
                      {formatPrice(minItemPrice)}đ
                    </span>
                    <div className="bg-[#4d362b] text-white p-2 rounded-xl shadow-md hover:bg-gray-800 transition-colors shrink-0">
                      <ShoppingCart size={12} />
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
