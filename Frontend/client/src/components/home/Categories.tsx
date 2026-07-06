import Image from "next/image";
import { ArrowRight, Coffee } from "lucide-react";
import Link from "next/link";
import { Category } from "@/types/category";
import { CategorySkeleton } from "@/components/skeletons/CategorySkeleton";

interface CategoriesProps {
  categories: Category[];
}

export function Categories({ categories }: CategoriesProps) {
  const displayCategories = categories.length > 0 ? categories : [];

  return (
    <section id="home-categories" className="bg-background py-12 scroll-mt-24">
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
                  className="group flex flex-col items-center p-6 bg-[#f5ede2] border border-[#855823]/10 rounded-md shadow-xs hover:shadow-md hover:-translate-y-1 hover:border-[#855823]/25 transition-all duration-500"
                >
                  {/* Image Container */}
                  <div className="w-20 h-20 bg-white/40 border border-[#855823]/5 rounded-md p-2 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 overflow-hidden shrink-0">
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
            Array.from({ length: 6 }).map((_, i) => (
              <CategorySkeleton key={i} />
            ))
          )}
        </div>
      </div>
    </section>
  );
}

