import { ArrowLeft, Star, Heart, Coffee } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductDetailClient from "./components/ProductDetailClient";
import { getServerApi } from "@/lib/server-api";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;

  try {
    const res = await getServerApi(`/api/v1/products/${id}`);
    const product = res?.data;

    if (!product) return { title: "Không tìm thấy sản phẩm | Brewtra Coffee" };

    return {
      title: `${product.name} | Brewtra Coffee`,
      description: product?.description ?? "Khám phá thực đơn cà phê đặc sắc tại Brewtra.",
    };
  } catch (error) {
    return { title: "Sản phẩm | Brewtra Coffee" };
  }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Fetch product and categories from server
  const [productRes, categoriesRes] = await Promise.all([
    getServerApi(`/api/v1/products/${id}`),
    getServerApi('/api/v1/categories')
  ]);

  const product = productRes?.data;
  const categories = categoriesRes?.data || [];

  if (!product) {
    notFound();
  }

  const categoryName = categories.find((c: any) => c.id === product.categoryId)?.name || "Chưa phân loại";
  const hasImage = !!product.imageUrl;

  return (
    <div className="min-h-screen bg-[#fdfaf5] pb-24">
      {/* Header — render trên Server */}
      <div className="px-6 py-6 flex items-center justify-between max-w-7xl mx-auto">
        <Link href="/menu" className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>

        <button className="p-2 bg-white rounded-full shadow-sm text-red-500 hover:bg-red-50 transition-colors">
          <Heart className="w-6 h-6" />
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 pt-4 items-start">
        {/* Product Info — SSR */}
        <div className="lg:col-span-5 relative aspect-square rounded-[32px] overflow-hidden shadow-2xl bg-white p-6 flex items-center justify-center">
          {hasImage ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={product.imageUrl}
              alt={product.name}
              className="object-contain w-full h-full p-4 md:p-12 hover:scale-110 transition-transform duration-700"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-primary/20">
              <Coffee className="w-24 h-24 mb-4" />
              <span className="text-xl font-black uppercase tracking-widest">No Image</span>
            </div>
          )}
        </div>

        <div className="lg:col-span-6 lg:col-start-7 flex flex-col">
          <div className="flex items-center gap-1 text-orange-400 mb-2">
            <Star className="w-4 h-4 fill-current" />
            <span className="text-sm font-bold text-gray-800">4.9 (120 đánh giá)</span>
          </div>

          <p className="text-[10px] text-primary/60 font-black uppercase tracking-widest mb-1">{categoryName}</p>
          <h1 className="text-4xl font-black text-gray-800 mb-4 uppercase tracking-tight">{product.name}</h1>
          <p className="text-3xl font-bold text-orange-500 mb-6">{product.price.toLocaleString('vi-VN')}đ</p>

          <div className="mb-8">
            <h3 className="font-bold text-gray-800 mb-3">Mô tả</h3>
            <p className="text-gray-500 leading-relaxed whitespace-pre-line">
              {product.description || "Hương vị nguyên bản, đậm đà từ những nguyên liệu tốt nhất."}
            </p>
          </div>

          {/* Interactive part — Client Component */}
          <ProductDetailClient product={{ id: product.id, name: product.name, price: product.price }} />
        </div>
      </div>
    </div>
  );
}
