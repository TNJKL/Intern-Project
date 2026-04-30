"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useCoffeeStore } from "@/store/useCoffeeStore";
import { useRouter } from "next/navigation";

const TRUE_CATEGORIES = [
  { id: "espresso", name: "Cà Phê Máy", image: "/images/cat-espresso.png", desc: "Đậm đà nguyên bản", count: "12 món" },
  { id: "coldbrew", name: "Ủ Lạnh", image: "/images/cold-brew.png", desc: "Thanh mát sảng khoái", count: "5 món" },
  { id: "tea", name: "Trà Trái Cây", image: "/images/tea-peach.png", desc: "Tươi mát ngày hè", count: "8 món" },
  { id: "bakery", name: "Bánh Ngọt", image: "/images/cat-bakery.jpg", desc: "Ngọt ngào từng miếng", count: "10 món" },
];

export function Categories() {
  const setSelectedMenuCategory = useCoffeeStore((state) => state.setSelectedMenuCategory);
  const router = useRouter();

  const handleCategoryClick = (id: string) => {
    setSelectedMenuCategory(id);
    router.push('/menu');
  };

  return (
    <section className="px-6 py-16 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
        <div>
          <span className="text-primary font-black text-[10px] uppercase tracking-[0.2em] mb-3 block">Khám Phá Hương Vị</span>
          <h2 className="text-4xl md:text-5xl font-black text-coffee-dark uppercase tracking-tighter">Danh Mục<br /><span className="text-primary/40">Sản Phẩm</span></h2>
        </div>
        <p className="text-gray-500 text-sm max-w-xs leading-relaxed font-medium">Khám phá đa dạng các hương vị được chăm chút tỉ mỉ từ những nguyên liệu tuyệt hảo nhất.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {TRUE_CATEGORIES.map((cat, index) => (
          <div
            key={cat.id}
            onClick={() => handleCategoryClick(cat.id)}
            className="group relative aspect-square w-full rounded-[32px] overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-shadow duration-500"
          >
            {/* Background Image with Zoom effect */}
            <Image
              src={cat.image}
              alt={cat.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              className="object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
              priority={index < 2}
            />

            {/* Elegant Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/80 transition-opacity duration-500"></div>
            <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 mix-blend-overlay"></div>

            {/* Content */}
            <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-2 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-100">{cat.count}</span>
              <h3 className="text-2xl font-black uppercase tracking-wide mb-1 group-hover:-translate-y-2 transition-transform duration-500">{cat.name}</h3>
              <p className="text-sm text-white/80 font-medium mb-6 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-150">{cat.desc}</p>

              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-all duration-500">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

