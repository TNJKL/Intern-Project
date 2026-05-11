import Image from "next/image";
import { ArrowRight, Coffee } from "lucide-react";
import Link from "next/link";
import { Category } from "@/types/category";

interface CategoriesProps {
  categories: Category[];
}

export function Categories({ categories }: CategoriesProps) {
  // If no categories from API, we could show a message or empty state, 
  // but usually we want at least a few items for design.
  const displayCategories = categories.length > 0 ? categories : [];

  return (
    <section className="px-6 py-16 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
        <div>
          <span className="text-primary font-black text-[10px] uppercase tracking-[0.2em] mb-3 block">Khám Phá Hương Vị</span>
          <h2 className="text-4xl md:text-5xl font-black text-coffee-dark uppercase tracking-tighter">Danh Mục<br /><span className="text-primary/40">Sản Phẩm</span></h2>
        </div>
        <p className="text-gray-500 text-sm max-w-xs leading-relaxed font-medium">Khám phá đa dạng các hương vị được chăm chút tỉ mỉ từ những nguyên liệu tuyệt hảo nhất.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
        {displayCategories.length > 0 ? (
          displayCategories.map((cat, index) => {
            const hasImage = !!cat.imageUrl;
            
            return (
              <Link
                key={cat.id}
                href={`/menu?category=${cat.id}`}
                className="group relative aspect-[4/5] w-full rounded-[24px] sm:rounded-[32px] overflow-hidden cursor-pointer shadow-sm hover:shadow-2xl transition-all duration-500 bg-[#fdfaf5] flex items-center justify-center border border-gray-100"
              >
                {/* Background Image or NO IMAGE placeholder */}
                {hasImage ? (
                  <Image
                    src={cat.imageUrl!}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 20vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                    priority={index < 2}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-primary/30">
                    <Coffee className="w-12 h-12 mb-2 opacity-50" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-50">No Image</span>
                  </div>
                )}

                {/* Glassmorphism Content Card */}
                <div className="absolute bottom-2 left-2 right-2 sm:bottom-3 sm:left-3 sm:right-3">
                  <div className="bg-white/90 backdrop-blur-xl p-3 sm:p-4 rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white flex items-center justify-between transform group-hover:-translate-y-1 sm:group-hover:-translate-y-2 transition-all duration-500 ease-out">
                    <div className="flex-1 pr-2 overflow-hidden">
                      <h3 className="text-sm sm:text-base font-black text-gray-800 uppercase tracking-tight mb-0.5 group-hover:text-primary transition-colors truncate">{cat.name}</h3>
                      {cat.description && (
                        <p className="text-[9px] sm:text-[10px] text-gray-500 font-medium line-clamp-1">{cat.description}</p>
                      )}
                    </div>
                    
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:shadow-lg group-hover:shadow-primary/30 transition-all duration-500">
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="col-span-full py-20 bg-white/50 backdrop-blur-sm rounded-[40px] border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Coffee className="w-8 h-8 text-primary/40" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Chưa có danh mục nào</h3>
            <p className="text-gray-500 max-w-xs mx-auto">Thực đơn đang được chúng tôi cập nhật, vui lòng quay lại sau nhé!</p>
          </div>
        )}
      </div>
    </section>
  );
}

