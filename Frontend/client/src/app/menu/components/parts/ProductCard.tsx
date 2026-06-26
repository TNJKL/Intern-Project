"use client";

import React from "react";
import { SafeImage } from "@/components/SafeImage";
import { Coffee, Star, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Product, ProductVariant } from "@/types/product";
import { Category } from "@/types/category";

interface ProductCardProps {
  product: Product;
  index: number;
  categories: Category[];
}

export const ProductCard = ({ product, index, categories }: ProductCardProps) => {
  const router = useRouter();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-[24px] p-3 shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 group flex flex-col h-full cursor-pointer relative"
      onClick={() => router.push(`/product/${product.slug || product.id}`)}
    >
      <div className="relative aspect-square rounded-[20px] overflow-hidden mb-3 bg-gray-50">
        <SafeImage
          src={product.imageUrl || ""}
          alt={product.name}
          fill
          priority={index < 10}
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 768px) 50vw, 20vw"
          fallback={
            <div className="flex flex-col items-center justify-center h-full text-primary/20">
              <Coffee className="w-10 h-10 mb-1" />
              <span className="text-[10px] font-black uppercase">No Image</span>
            </div>
          }
        />
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-md px-2 py-1 rounded-xl flex items-center gap-1 shadow-sm border border-black/5">
          <Star className="w-3 h-3 text-orange-400 fill-current" />
          <span className="text-[10px] font-black">4.9</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <p className="text-[10px] text-primary/60 font-black uppercase tracking-widest mb-1 line-clamp-1">
          {categories.find(c => c.id === product.categoryId)?.name || "Brewtra Special"}
        </p>
        <h3 className="font-bold text-gray-800 mb-1 line-clamp-1">{product.name}</h3>
        <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed hidden md:block">
          {product.description || "Hương vị nguyên bản, đậm đà từ những nguyên liệu tốt nhất."}
        </p>

        <div className="mt-auto flex items-center justify-between pt-2 border-t border-gray-50">
          <span className="font-black text-coffee-dark text-lg">
            {(product.variants && product.variants.length > 0
              ? Math.min(...product.variants.map((v: ProductVariant) => v.price)).toLocaleString('vi-VN')
              : (product.price || 0).toLocaleString('vi-VN')
            )}đ
          </span>
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
            <Plus className="w-5 h-5" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
