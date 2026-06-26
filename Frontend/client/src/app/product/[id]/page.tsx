import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductDetailClient from "./components/ProductDetailClient";
import ProductImageGallery from "./components/ProductImageGallery";
import SuggestedProductsCarousel from "./components/SuggestedProductsCarousel";
import { getServerApi } from "@/lib/server-api";

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

  // 🎯 ĐÃ SỬA: Logic gợi ý sản phẩm phân cấp thông minh
  const candidateProducts = (allProducts || []).filter(
    (p: any) => p.isAvailable && p.id !== product.id
  );

  // Nhóm 1: Cùng danh mục và là nổi bật (Featured)
  const sameCategoryFeatured = candidateProducts.filter(
    (p: any) => p.categoryId === product.categoryId && p.isFeatured
  );

  // Nhóm 2: Cùng danh mục nhưng không nổi bật
  const sameCategoryRegular = candidateProducts.filter(
    (p: any) => p.categoryId === product.categoryId && !p.isFeatured
  );

  // Nhóm 3: Khác danh mục và là nổi bật (Featured)
  const otherCategoryFeatured = candidateProducts.filter(
    (p: any) => p.categoryId !== product.categoryId && p.isFeatured
  );

  // Nhóm 4: Khác danh mục và không nổi bật
  const otherCategoryRegular = candidateProducts.filter(
    (p: any) => p.categoryId !== product.categoryId && !p.isFeatured
  );

  // Gộp lại theo thứ tự ưu tiên và lấy tối đa 15 sản phẩm cho thanh cuộn ngang tự động
  const suggestedProducts = [
    ...sameCategoryFeatured,
    ...sameCategoryRegular,
    ...otherCategoryFeatured,
    ...otherCategoryRegular,
  ].slice(0, 15);

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
        <div className="bg-[#fdfaf5] p-4 sm:p-8 flex flex-col lg:flex-row gap-8 lg:gap-10 xl:gap-16 lg:items-stretch items-start">

          {/* Hình ảnh (Trái) */}
          <div className="w-full lg:w-[380px] xl:w-[450px] shrink-0 flex flex-col">
            <ProductImageGallery
              imageUrl={product.imageUrl}
              additionalImageUrls={product.additionalImageUrls}
              name={product.name}
            />
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

        {/* KHỐI SẢN PHẨM ĐỀ XUẤT NỔI BẬT (Thanh cuộn ngang tự động) */}
        <SuggestedProductsCarousel
          products={suggestedProducts}
          categories={categories}
        />

      </div>
    </div>
  );
}