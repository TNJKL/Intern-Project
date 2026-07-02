"use client";

import { SafeImage } from "@/components/SafeImage";
import Link from "next/link";
import { Star, Plus, Coffee } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Product, ProductVariant } from "@/types/product";
import { Category } from "@/types/category";

interface FeaturedProductListProps {
  products: Product[];
  categories: Category[];
}

export function FeaturedProductList({ products = [], categories = [] }: FeaturedProductListProps) {
  // Hiển thị tối đa 10 sản phẩm nổi bật để chia hết cho hàng 5 cột
  const displayProducts = products.filter(p => p.isAvailable && p.isFeatured).slice(0, 10);

  return (
    <section id="home-featured" className="px-6 py-8 max-w-7xl mx-auto w-full scroll-mt-24">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black text-coffee-dark uppercase tracking-tight">Sản Phẩm nổi bật</h2>
        <Link href="/menu" className="text-primary font-black text-[10px] uppercase tracking-widest hover:underline decoration-2 underline-offset-4 transition-all">Xem tất cả</Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <AnimatePresence mode="popLayout">
          {displayProducts.length > 0 ? displayProducts.map((product, index) => {
            const categoryName = categories.find(c => c.id === product.categoryId)?.name || "Chưa phân loại";
            const hasImage = !!product.imageUrl;

            return (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="group h-full"
              >
                <Link href={`/product/${product.slug || product.id}`} className="block h-full">
                  <div className="bg-secondary p-3 md:p-4 rounded-[28px] hover:shadow-[0_10px_30px_-10px_rgba(60,42,33,0.08)] transition-all duration-500 border border-transparent hover:border-primary/5 relative flex flex-col h-full">
                    <div className="relative aspect-square mb-4 rounded-2xl overflow-hidden flex items-center justify-center shrink-0">
                      <SafeImage
                        src={product.imageUrl || ""}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-contain p-2 md:p-4 group-hover:scale-110 transition-transform duration-700"
                        priority={index < 4}
                        fallback={
                          <div className="flex flex-col items-center justify-center text-primary/20">
                            <Coffee className="w-12 h-12 mb-1" />
                            <span className="text-[10px] font-black uppercase tracking-widest">No Image</span>
                          </div>
                        }
                      />
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 border border-black/5 shadow-sm">
                        <Star className="w-3 h-3 text-orange-400 fill-current" />
                        <span className="text-[10px] font-black">4.9</span>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col">
                      <p className="text-[9px] text-primary/60 font-black uppercase tracking-widest mb-1 line-clamp-1">{categoryName}</p>
                      <h3 className="font-black text-gray-800 group-hover:text-primary transition-colors truncate uppercase text-sm mb-1">
                        {product.name}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed hidden md:block">
                        {product.description || "Hương vị nguyên bản, đậm đà từ những nguyên liệu tốt nhất."}
                      </p>
                      <div className="flex items-center justify-between pt-2 mt-auto border-t border-gray-50">
                        <span className="font-black text-coffee-dark text-base md:text-lg">
                          {(product.variants && product.variants.length > 0
                            ? Math.min(...product.variants.map((v: ProductVariant) => v.price))
                            : product.price || 0
                          ).toLocaleString('vi-VN')}đ
                        </span>
                        <button className="bg-primary text-white p-2 rounded-xl shadow-md shadow-primary/20 hover:bg-coffee-dark active:scale-90 transition-all shrink-0">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          }) : (
            <div className="col-span-full py-16 text-center">
              <Coffee className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Chưa có sản phẩm nào được hiển thị.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
