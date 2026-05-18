import { Categories } from "@/components/home/Categories";
import { ProductList } from "@/components/product/ProductList";
import { Features } from "@/components/home/Features";
import { AboutUs } from "@/components/home/AboutUs";
import { Hero } from "@/components/home/Hero";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: "Brewtra Coffee - Hương vị nguyên bản",
  description: "Trải nghiệm cà phê tuyệt hảo từ những hạt cà phê tuyển chọn nhất.",
};

import { getServerApi } from "@/lib/server-api";
import { Category } from "@/types/category";
import { Product } from "@/types/product";

export default async function Home() {
  let categories: Category[] = [];
  let products: Product[] = [];

  try {
    const [categoryRes, productRes] = await Promise.all([
      getServerApi('/api/v1/categories'),
      getServerApi('/api/v1/products')
    ]);

    if (categoryRes?.success) categories = categoryRes.data;
    if (productRes?.success) products = productRes.data;
  } catch (error) {
    console.error("Failed to fetch data for home page:", error);
  }

  return (
    <div className="relative">
      <Hero />

      <Categories categories={categories} />
      <ProductList products={products} categories={categories} />
      <AboutUs />
      <Features />
      
      {/* Background blobs for aesthetic */}
      <div className="absolute top-0 left-1/2 -z-10 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute top-1/3 right-0 -z-10 w-[600px] h-[600px] bg-accent/10 blur-[150px] rounded-full translate-x-1/3"></div>
    </div>
  );
}
