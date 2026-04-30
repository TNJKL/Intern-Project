"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PRODUCTS = [
  {
    id: "1",
    name: "Latte",
    price: "45.000",
    rating: "4.8",
    image: "/images/product-cappuccino-new.jpg",
    category: "espresso",
    categoryLabel: "Cà Phê Máy"
  },
  {
    id: "2",
    name: "Espresso",
    price: "35.000",
    rating: "4.9",
    image: "/images/product-espresso-new.jpg",
    category: "espresso",
    categoryLabel: "Cà Phê Máy"
  },
  {
    id: "3",
    name: "Cappuccino",
    price: "45.000",
    rating: "4.7",
    image: "/images/product-cappuccino-new.jpg",
    category: "espresso",
    categoryLabel: "Cà Phê Máy"
  },
  {
    id: "4",
    name: "Cold Brew",
    price: "55.000",
    rating: "4.9",
    image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&h=400&fit=crop",
    category: "coldbrew",
    categoryLabel: "Ủ Lạnh"
  },
  {
    id: "5",
    name: "Trà Đào Cam Sả",
    price: "45.000",
    rating: "4.8",
    image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop",
    category: "tea",
    categoryLabel: "Trà Trái Cây"
  },
  {
    id: "6",
    name: "Bánh Croissant",
    price: "35.000",
    rating: "4.7",
    image: "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=400&h=400&fit=crop",
    category: "bakery",
    categoryLabel: "Bánh Ngọt"
  }
];

export function ProductList() {
  return (
    <section className="px-6 py-8 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black text-coffee-dark uppercase tracking-tight">Dành cho bạn</h2>
        <Link href="/menu" className="text-primary font-black text-[10px] uppercase tracking-widest hover:underline decoration-2 underline-offset-4 transition-all">Xem tất cả</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {PRODUCTS.map((product, index) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="group"
            >
            <Link href={`/product/${product.id}`} className="block">
              <div className="bg-white p-4 rounded-[28px] shadow-sm hover:shadow-[0_20px_40px_-10px_rgba(60,42,33,0.1)] transition-all duration-500 border border-transparent hover:border-primary/5 relative">
                <div className="relative aspect-square mb-4 rounded-2xl overflow-hidden bg-[#fdfaf5]">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-contain p-4 group-hover:scale-110 transition-transform duration-700"
                    priority={index < 2}
                  />
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 border border-black/5">
                    <Star className="w-3 h-3 text-orange-400 fill-current" />
                    <span className="text-[10px] font-black">{product.rating}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[9px] text-primary/40 font-black uppercase tracking-widest">{product.categoryLabel}</p>
                  <h3 className="font-black text-gray-800 group-hover:text-primary transition-colors truncate uppercase text-sm">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between pt-2">
                    <span className="font-black text-coffee-dark">{product.price}đ</span>
                    <button className="bg-primary text-white p-2 rounded-xl shadow-lg shadow-primary/20 hover:bg-coffee-dark active:scale-90 transition-all">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
