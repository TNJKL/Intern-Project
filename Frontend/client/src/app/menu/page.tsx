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
  
  const productQueryParams = new URLSearchParams();
  productQueryParams.append("page", "0");
  productQueryParams.append("size", "10");
  productQueryParams.append("isAvailable", "true");
  productQueryParams.append("includeDeleted", "false");

  if (sortParam === "name-asc") {
    productQueryParams.append("sort", "name,asc");
    productQueryParams.append("sort", "createdAt,asc");
  } else if (sortParam === "name-desc") {
    productQueryParams.append("sort", "name,desc");
    productQueryParams.append("sort", "createdAt,asc");
  } else {
    productQueryParams.append("sort", "displayOrder,asc");
    productQueryParams.append("sort", "createdAt,asc");
  }

  if (categoryId && categoryId !== "all") productQueryParams.append("categoryId", categoryId);
  if (keyword) productQueryParams.append("keyword", keyword);

  let products: Product[] = [];
  let categories: Category[] = [];

  try {
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
    }
  } catch (error) {
    console.error("Failed to fetch data for menu page:", error);
  }

  return (
    <MenuClient initialProducts={products} initialCategories={categories} />
  );
}
