import Image from "next/image";
import { ArrowRight, Coffee } from "lucide-react";
import Link from "next/link";
import { Category } from "@/types/category";

interface CategoriesProps {
  categories: Category[];
}

export function Categories({ categories }: CategoriesProps) {
  const displayCategories = categories.length > 0 ? categories : [];

  return (
    <section className="bg-[#fdfaf5] py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-coffee-dark uppercase tracking-tight">Danh mục</h2>
          <Link href="/menu" className="text-primary font-black text-[10px] uppercase tracking-widest hover:underline decoration-2 underline-offset-4 transition-all">Tất cả</Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {displayCategories.length > 0 ? (
            displayCategories.map((cat) => {
              const hasImage = !!cat.imageUrl;
              
              return (
                <Link
                  key={cat.id}
                  href={`/menu?category=${cat.id}`}
                  className="group flex flex-col items-center p-6 bg-[#fdf3eb] rounded-[32px] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500"
                >
                  {/* Image Container */}
                  <div className="w-20 h-20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 overflow-hidden">
                    {hasImage ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={cat.imageUrl!}
                          alt={cat.name}
                          fill
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <Coffee className="w-10 h-10 text-primary/20" />
                    )}
                  </div>

                  {/* Category Name */}
                  <span className="text-sm font-black text-gray-800 text-center line-clamp-2 leading-tight group-hover:text-primary transition-colors uppercase tracking-tight">
                    {cat.name}
                  </span>
                </Link>
              );
            })
          ) : (
            <div className="col-span-full py-20 bg-white/50 rounded-[40px] border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
              <Coffee className="w-12 h-12 text-gray-200 mb-4" />
              <h3 className="text-lg font-bold text-gray-800">Đang cập nhật danh mục</h3>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

