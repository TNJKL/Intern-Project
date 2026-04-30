"use client";

import { useState } from "react";
import Image from "next/image";
import { Search, Star, Plus, Filter, SlidersHorizontal, Coffee, CupSoda, Cake } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCoffeeStore } from "@/store/useCoffeeStore";

const CATEGORIES = [
  { id: "all", label: "Tất cả", icon: Coffee },
  { id: "espresso", label: "Cà Phê Máy", icon: Coffee },
  { id: "coldbrew", label: "Ủ Lạnh", icon: CupSoda },
  { id: "tea", label: "Trà Trái Cây", icon: CupSoda },
  { id: "bakery", label: "Bánh Ngọt", icon: Cake },
];

const PRODUCTS = [
  {
    id: "1",
    name: "Phin Sữa Đá",
    price: "29.000",
    rating: "4.9",
    image: "/images/product-cappuccino-new.jpg",
    category: "espresso",
    description: "Cà phê phin truyền thống kết hợp với sữa đặc đậm đà."
  },
  {
    id: "2",
    name: "Phin Đen Đá",
    price: "29.000",
    rating: "4.8",
    image: "/images/product-espresso-new.jpg",
    category: "espresso",
    description: "Cà phê phin đen nguyên chất, mạnh mẽ và tỉnh táo."
  },
  {
    id: "3",
    name: "Trà Sen Vàng",
    price: "45.000",
    rating: "4.7",
    image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop",
    category: "tea",
    description: "Trà oolong thanh mát kết hợp hạt sen thơm bùi."
  },
  {
    id: "4",
    name: "Cold Brew Nguyên Bản",
    price: "55.000",
    rating: "4.9",
    image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&h=400&fit=crop",
    category: "coldbrew",
    description: "Cà phê ủ lạnh thanh mát, ít đắng, đánh thức mọi giác quan."
  },
  {
    id: "5",
    name: "Bánh Mì Que",
    price: "15.000",
    rating: "4.6",
    image: "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=400&h=400&fit=crop",
    category: "bakery",
    description: "Bánh mì que giòn rụm với pate thơm ngon."
  },
  {
    id: "6",
    name: "Espresso",
    price: "35.000",
    rating: "4.9",
    image: "/images/product-espresso-new.jpg",
    category: "espresso",
    description: "Cà phê máy nguyên chất, hương vị đậm đà chuẩn Ý."
  },
  {
    id: "7",
    name: "Trà Thạch Đào",
    price: "45.000",
    rating: "4.8",
    image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop",
    category: "tea",
    description: "Trà đào thơm mát cùng thạch đào giòn sần sật."
  },
  {
    id: "8",
    name: "Caramel Macchiato",
    price: "55.000",
    rating: "4.8",
    image: "/images/product-cappuccino-new.jpg",
    category: "espresso",
    description: "Sự kết hợp hoàn hảo giữa Espresso, sữa nóng và caramel."
  }
];

export default function MenuPage() {
  const selectedMenuCategory = useCoffeeStore((state) => state.selectedMenuCategory);
  const setSelectedMenuCategory = useCoffeeStore((state) => state.setSelectedMenuCategory);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Lọc sản phẩm theo danh mục và tìm kiếm
  const filteredProducts = PRODUCTS.filter((product) => {
    const matchesCategory = selectedMenuCategory === "all" || product.category === selectedMenuCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#fcf9f2] pb-32">
      {/* Header & Search Section */}
      <div className="bg-coffee-dark relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black/20 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto px-6 pt-12 pb-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight mb-2">
                Thực Đơn
              </h1>
              <p className="text-white/70 font-medium">Khám phá hương vị cà phê tuyệt hảo</p>
            </div>
          </div>

          {/* Smart Search */}
          <div className="relative max-w-2xl">
            <div className={`relative flex items-center bg-white rounded-2xl p-2 transition-all duration-300 ${isSearchFocused ? 'shadow-[0_0_0_4px_rgba(200,169,126,0.3)]' : 'shadow-lg'}`}>
              <div className="pl-4 pr-2 text-gray-400">
                <Search className="w-6 h-6" />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm đồ uống, bánh ngọt..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="w-full bg-transparent border-none text-gray-800 font-medium py-3 outline-none placeholder:text-gray-400"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="px-4 text-xs font-bold text-gray-400 hover:text-gray-600 uppercase"
                >
                  Xóa
                </button>
              )}
            </div>

            {/* Gợi ý tìm kiếm (Mockup) */}
            <AnimatePresence>
              {isSearchFocused && searchQuery.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl overflow-hidden z-20 border border-gray-100"
                >
                  <div className="p-2">
                    <p className="text-xs font-bold text-gray-400 uppercase px-4 py-2">Gợi ý sản phẩm</p>
                    {filteredProducts.slice(0, 3).map(product => (
                      <div key={`suggest-${product.id}`} className="flex items-center gap-3 p-3 hover:bg-primary/5 rounded-xl cursor-pointer transition-colors">
                        <div className="w-12 h-12 relative rounded-lg overflow-hidden bg-gray-100 shrink-0">
                          <Image src={product.image} alt={product.name} fill className="object-cover" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-gray-800">{product.name}</p>
                          <p className="text-primary font-black text-sm">{product.price}đ</p>
                        </div>
                      </div>
                    ))}
                    {filteredProducts.length === 0 && (
                      <div className="px-4 py-6 text-center text-gray-500 text-sm">
                        Không tìm thấy sản phẩm nào phù hợp
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Categories */}
        <div className="flex items-center gap-4 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6 md:mx-0 md:px-0">
          <div className="flex items-center gap-2">
            {CATEGORIES.map((category) => {
              const isActive = selectedMenuCategory === category.id;
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedMenuCategory(category.id)}
                  className={`flex items-center gap-2 px-6 py-3.5 rounded-full whitespace-nowrap font-black text-sm transition-all duration-300 ${
                    isActive 
                      ? "bg-primary text-white shadow-lg shadow-primary/30 scale-105" 
                      : "bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-800 shadow-sm"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-primary'}`} />
                  {category.label}
                </button>
              );
            })}
          </div>
          
          <div className="ml-auto flex items-center shrink-0">
            <button className="flex items-center gap-2 px-5 py-3.5 bg-white text-gray-700 font-bold text-sm rounded-full shadow-sm hover:bg-gray-50 transition-colors border border-gray-100">
              <SlidersHorizontal className="w-4 h-4 text-primary" />
              Bộ lọc
            </button>
          </div>
        </div>

        {/* Product Grid */}
        <div className="mt-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-800 uppercase">
              {selectedMenuCategory === "all" ? "Tất cả sản phẩm" : CATEGORIES.find(c => c.id === selectedMenuCategory)?.label}
            </h2>
            <span className="text-sm font-bold text-gray-400">{filteredProducts.length} sản phẩm</span>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-3xl p-3 md:p-4 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-transparent hover:border-primary/10 group flex flex-col"
                >
                  <div className="relative aspect-square mb-4 rounded-2xl overflow-hidden bg-[#fdfaf5]">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-md px-2 py-1 rounded-xl flex items-center gap-1 shadow-sm">
                      <Star className="w-3 h-3 text-orange-400 fill-current" />
                      <span className="text-xs font-black">{product.rating}</span>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col">
                    <p className="text-[10px] text-primary/60 font-black uppercase tracking-widest mb-1">{CATEGORIES.find(c => c.id === product.category)?.label}</p>
                    <h3 className="font-bold text-gray-800 mb-1 line-clamp-1">{product.name}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed hidden md:block">
                      {product.description}
                    </p>
                    
                    <div className="mt-auto flex items-center justify-between pt-2 border-t border-gray-100">
                      <span className="font-black text-coffee-dark text-lg">{product.price}đ</span>
                      <button className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors active:scale-95">
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Không tìm thấy sản phẩm</h3>
              <p className="text-gray-500">Vui lòng thử lại với từ khóa khác</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
