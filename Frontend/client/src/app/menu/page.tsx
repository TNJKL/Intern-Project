import MenuClient from "./components/MenuClient";
import { ProductList } from "./components/parts/ProductList";

export const metadata = {
  title: "Thực đơn | Brewtra Coffee",
  description: "Khám phá danh sách đồ uống và bánh ngọt tuyệt vời tại Brewtra Coffee.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { getServerApi } from "@/lib/server-api";
import { Category } from "@/types/category";
import { Product } from "@/types/product";

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; keyword?: string; sort?: string }>;
}) {
  const { category: categoryId, keyword, sort: sortParam } = await searchParams;
  
  // Ánh xạ từ format URL (name-asc) sang format API (name,asc)
  let apiSort = "displayOrder,asc";
  let isManualSort = false;
  
  if (sortParam) {
    if (sortParam === "name-asc") {
      apiSort = "name,asc";
    } else if (sortParam === "name-desc") {
      apiSort = "name,desc";
    } else if (sortParam.startsWith("price-")) {
      // Backend không hỗ trợ sort theo giá (do giá nằm trong variants)
      // Nên ta sẽ sort thủ công ở Server sau khi lấy data
      isManualSort = true;
      apiSort = "displayOrder,asc";
    }
  }

  let products: Product[] = [];
  let categories: Category[] = [];

  try {
    const productQueryParams = new URLSearchParams({
      page: "0",
      size: "100",
      sort: apiSort,
    });
    if (categoryId && categoryId !== "all") productQueryParams.append("categoryId", categoryId);
    if (keyword) productQueryParams.append("keyword", keyword);

    const [categoryRes, productRes] = await Promise.all([
      getServerApi('/api/v1/categories'),
      getServerApi(`/api/v1/products?${productQueryParams.toString()}`)
    ]);

    if (categoryRes?.success) {
      categories = categoryRes.data.filter((c: any) => 
        !(c.isDeleted || c.deleted || c.deletedAt) && c.isActive !== false
      );
    }
    
    if (productRes?.success) {
      const allData = Array.isArray(productRes.data) ? productRes.data : (productRes.data?.data || []);
      products = allData.filter((p: any) => 
        !(p.isDeleted || p.deleted || p.deletedAt) && p.isAvailable === true
      );

      /* 
      // Thực hiện sort thủ công nếu cần (Tạm thời note lại)
      if (isManualSort) {
        const getPrice = (p: Product) => {
          if (p.variants && p.variants.length > 0) {
            return Math.min(...p.variants.map((v: any) => v.price));
          }
          return p.price || 0;
        };

        products.sort((a, b) => {
          const priceA = getPrice(a);
          const priceB = getPrice(b);
          return sortParam === "price-asc" ? priceA - priceB : priceB - priceA;
        });
      }
      */
    }
  } catch (error) {
    console.error("Failed to fetch data for menu page:", error);
  }

  return (
    <MenuClient initialProducts={products} initialCategories={categories}>
      <ProductList products={products} categories={categories} isLoading={false} />
    </MenuClient>
  );
}
