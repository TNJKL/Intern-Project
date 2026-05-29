import { ArrowLeft, Coffee, Flame, Star, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { SafeImage } from "@/components/SafeImage";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductDetailClient from "./components/ProductDetailClient";
import { getServerApi } from "@/lib/server-api";
import { ProductVariant } from "@/types/product";

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN').format(price);
};

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
  } catch {
    return { title: "Sản phẩm | Brewtra Coffee" };
  }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // 🎯 ĐÃ SỬA: Gọi thêm API lấy toàn bộ sản phẩm để đưa vào phần đề xuất
  const [productRes, variantsRes, categoriesRes, toppingsRes, allProductsRes] = await Promise.all([
    getServerApi(`/api/v1/products/${id}`),
    getServerApi(`/api/v1/products/${id}/variants`),
    getServerApi('/api/v1/categories'),
    getServerApi('/api/v1/toppings'),
    getServerApi('/api/v1/products') // Thêm luồng lấy danh sách tổng sản phẩm
  ]);

  const product = productRes?.data;
  const variants = variantsRes?.data || variantsRes || [];
  const categories = categoriesRes?.data || [];
  const allToppings = toppingsRes?.data || [];
  const allProducts = allProductsRes?.data || []; // Gán mảng sản phẩm thật từ server

  if (!product) notFound();

  const productWithVariants = {
    ...product,
    variants: Array.isArray(variants) ? variants : [],
    toppings: allToppings.filter((t: any) =>
      product.toppingIds?.includes(t.id) || (product.toppings?.some((pt: any) => pt.id === t.id))
    )
  };

  const suggestedProducts = (allProducts || [])
    .filter((p: any) => p.isAvailable && p.isFeatured && p.id !== product.id)
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-[#fdfaf5]">
      {/* Top nav */}
      <div className="px-8 lg:px-16 pt-6 pb-2">
        <Link
          href="/menu"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Thực đơn
        </Link>
      </div>

      {/* Main layout */}
      <div className="px-4 sm:px-8 lg:px-16 py-6 pb-28">
        <div className="bg-[#fdfaf5] p-4 sm:p-8 flex flex-col lg:flex-row gap-8 lg:gap-10 xl:gap-16 items-start">

          {/* Hình ảnh (Trái) */}
          <div className="w-full lg:w-[380px] xl:w-[450px] shrink-0">
            <div className="aspect-square rounded-lg bg-white border border-gray-100 flex items-center justify-center overflow-hidden relative">
              <SafeImage
                src={product.imageUrl || ""}
                alt={product.name}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, (max-width: 1280px) 380px, 450px"
                fallback={
                  <div className="flex flex-col items-center justify-center text-gray-200 w-full h-full bg-gray-50">
                    <Coffee className="w-20 h-20 mb-3 text-gray-300" />
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-300">Chưa có ảnh</span>
                  </div>
                }
              />
            </div>
          </div>

          {/* Thông tin & Thuộc tính (Phải) */}
          <div className="flex-1 flex flex-col pt-2 w-full">
            {/* 🎯 ĐÃ SỬA: Chuyển cụm Tên sản phẩm vào hẳn phía bên trong ProductDetailClient 
                để bảo toàn đúng cấu trúc thiết kế 2 cột chuẩn TMĐT của bạn */}
            <ProductDetailClient
              product={productWithVariants}
            />
          </div>

        </div>

        {/* KHỐI SẢN PHẨM ĐỀ XUẤT NỔI BẬT (Full-width bên dưới) */}
        <div className="border-t border-gray-200 pt-10 mt-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-red-100 rounded text-red-600">
                <Flame size={20} className="fill-red-600 animate-pulse" />
              </div>
              <h2 className="text-lg font-extrabold text-gray-900 uppercase tracking-tight">
                Sản phẩm gợi ý cho bạn
              </h2>
            </div>
            <Link href="/menu" className="text-xs font-bold text-[#4d362b] hover:underline">Xem tất cả</Link>
          </div>

          {suggestedProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
              {suggestedProducts.map((item: any) => {
                const minItemPrice = item.variants && item.variants.length > 0
                  ? Math.min(...item.variants.map((v: ProductVariant) => v.price))
                  : item.price || 0;
                const categoryName = categories.find((c: any) => c.id === item.categoryId)?.name || "Nổi bật";

                return (
                  <div
                    key={item.id}
                    className="group bg-[#fdf3eb] p-4 rounded-[24px] border border-transparent hover:border-[#4d362b]/5 hover:shadow-[0_10px_30px_-10px_rgba(60,42,33,0.08)] transition-all duration-300 flex flex-col justify-between h-full min-w-0"
                  >
                    <Link href={`/product/${item.id}`} className="flex flex-col h-full w-full min-w-0">

                      {/* Khu vực ảnh */}
                      <div className="relative aspect-square mb-3 rounded-2xl overflow-hidden bg-white flex items-center justify-center shrink-0 border border-gray-50 w-full">
                        <SafeImage
                          src={item.imageUrl || ""}
                          alt={item.name}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                          className="object-contain p-2 group-hover:scale-110 transition-transform duration-700"
                          fallback={
                            <div className="flex flex-col items-center justify-center text-gray-300">
                              <Coffee className="w-8 h-8 mb-1" />
                              <span className="text-[8px] font-black tracking-widest">No Image</span>
                            </div>
                          }
                        />
                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded-lg flex items-center gap-0.5 border border-black/5 shadow-sm">
                          <Star className="w-2.5 h-2.5 text-orange-400 fill-current" />
                          <span className="text-[9px] font-black">4.9</span>
                        </div>
                      </div>

                      {/* Nội dung chữ */}
                      <div className="flex-1 flex flex-col justify-between min-w-0 space-y-1">
                        <div className="min-w-0">
                          <p className="text-[9px] text-[#4d362b]/60 font-black uppercase tracking-widest truncate">
                            {categoryName}
                          </p>
                          <h3 className="font-black text-gray-800 group-hover:text-[#4d362b] transition-colors truncate uppercase text-xs md:text-sm">
                            {item.name}
                          </h3>
                          <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed pt-0.5">
                            {item.description || "Hương vị nguyên bản đậm đà."}
                          </p>
                        </div>

                        {/* Giá & Icon giỏ hàng */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100/50 mt-auto min-w-0">
                          <span className="font-black text-[#4d362b] text-xs sm:text-sm whitespace-nowrap truncate pr-1">
                            {formatPrice(minItemPrice)}đ
                          </span>
                          <div className="bg-[#4d362b] text-white p-2 rounded-xl shadow-md hover:bg-gray-800 transition-colors shrink-0">
                            <ShoppingCart size={12} />
                          </div>
                        </div>
                      </div>

                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-10 text-center border border-dashed border-gray-200 rounded-sm">
              <Coffee className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Chưa có sản phẩm đề xuất nào.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}