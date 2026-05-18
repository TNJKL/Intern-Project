import { ArrowLeft, Coffee } from "lucide-react";
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
  } catch {
    return { title: "Sản phẩm | Brewtra Coffee" };
  }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [productRes, variantsRes, categoriesRes, toppingsRes] = await Promise.all([
    getServerApi(`/api/v1/products/${id}`),
    getServerApi(`/api/v1/products/${id}/variants`),
    getServerApi('/api/v1/categories'),
    getServerApi('/api/v1/toppings')
  ]);

  const product = productRes?.data;
  const variants = variantsRes?.data || variantsRes || [];
  const categories = categoriesRes?.data || [];
  const allToppings = toppingsRes?.data || [];

  if (!product) notFound();

  const productWithVariants = {
    ...product,
    variants: Array.isArray(variants) ? variants : [],
    toppings: allToppings.filter((t: any) => 
      product.toppingIds?.includes(t.id) || (product.toppings?.some((pt: any) => pt.id === t.id))
    )
  };

  const categoryName = categories.find((c: any) => c.id === product.categoryId)?.name || "Thức uống";

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
      <div className="px-8 lg:px-16 py-6 pb-28">
        <div className="bg-[#fdfaf5] p-8 flex flex-col lg:flex-row gap-10 lg:gap-16 items-start">

          {/* Hình ảnh (Trái) */}
          <div className="w-full lg:w-[450px] shrink-0">
            <div className="aspect-square rounded-lg bg-white border border-gray-100 flex items-center justify-center overflow-hidden">
              {product.imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-200 w-full h-full bg-gray-50">
                  <Coffee className="w-20 h-20 mb-3 text-gray-300" />
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-300">Chưa có ảnh</span>
                </div>
              )}
            </div>
          </div>

          {/* Thông tin (Phải) */}
          <div className="flex-1 flex flex-col pt-2">
            {/* Tên sản phẩm */}
            <div className="flex items-center gap-2 mb-6">
              <h1 className="text-2xl font-bold text-gray-800 leading-tight">
                {product.name}
              </h1>
            </div>

            {/* Phần chọn size + thêm giỏ hàng (Client) */}
            <ProductDetailClient product={productWithVariants} />
          </div>

        </div>
      </div>
    </div>
  );
}
