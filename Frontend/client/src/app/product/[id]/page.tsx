"use client";

import { ArrowLeft, ShoppingCart, Star, Heart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useParams } from 'next/navigation';

export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id;

  return (
    <div className="min-h-screen bg-[#fdfaf5] pb-24">
      {/* Header */}
      <div className="px-6 py-6 flex items-center justify-between">
        <Link href="/" className="p-2 bg-white rounded-full shadow-sm">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-lg font-bold">Chi tiết sản phẩm</h1>
        <button className="p-2 bg-white rounded-full shadow-sm text-red-500">
          <Heart className="w-6 h-6" />
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 pt-8">
        {/* Product Image */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative aspect-square rounded-[40px] overflow-hidden shadow-2xl bg-white p-8"
        >
          <Image 
            src="/images/latte-hero.png" 
            alt="Product" 
            fill 
            className="object-contain p-12"
          />
        </motion.div>

        {/* Product Info */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1 text-orange-400 mb-2">
            <Star className="w-4 h-4 fill-current" />
            <span className="text-sm font-bold text-gray-800">4.9 (120 đánh giá)</span>
          </div>
          
          <h1 className="text-4xl font-black text-gray-800 mb-4 uppercase tracking-tight">
            Latte Art Coffee
          </h1>
          
          <p className="text-3xl font-bold text-orange-500 mb-6">45.000đ</p>
          
          <div className="mb-8">
            <h3 className="font-bold text-gray-800 mb-3">Mô tả</h3>
            <p className="text-gray-500 leading-relaxed">
              Latte Art của Brewtra không chỉ là một thức uống, mà là một tác phẩm nghệ thuật. 
              Sự kết hợp hoàn hảo giữa espresso đậm đặc và sữa nóng đánh bọt mịn màng, 
              tạo nên hương vị béo ngậy và dịu êm.
            </p>
          </div>

          <div className="mb-10">
            <h3 className="font-bold text-gray-800 mb-3">Kích thước</h3>
            <div className="flex gap-4">
              {['S', 'M', 'L'].map((size) => (
                <button key={size} className="w-12 h-12 rounded-xl border-2 border-gray-100 flex items-center justify-center font-bold hover:border-orange-500 hover:text-orange-500 transition-all">
                  {size}
                </button>
              ))}
            </div>
          </div>

          <button className="w-full bg-orange-500 text-white py-5 rounded-2xl flex items-center justify-center gap-3 font-bold shadow-xl shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
            <ShoppingCart className="w-6 h-6" />
            Thêm vào giỏ hàng
          </button>
        </div>
      </div>
    </div>
  );
}
