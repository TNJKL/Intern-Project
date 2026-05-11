import MenuClient from "./components/MenuClient";

export const metadata = {
  title: "Thực đơn | Brewtra Coffee",
  description: "Khám phá danh sách đồ uống và bánh ngọt tuyệt vời tại Brewtra Coffee.",
};

import { getServerApi } from "@/lib/server-api";
import { Category } from "@/types/category";
import { Product } from "@/types/product";

export default async function MenuPage() {
  let products: Product[] = [];
  let categories: Category[] = [];

  try {
    const categoryRes = await getServerApi('/api/v1/categories');
    if (categoryRes && categoryRes.success) {
      categories = categoryRes.data;
    }

    const productRes = await getServerApi('/api/v1/products');
    if (productRes && productRes.success) {
      products = productRes.data;
    }
  } catch (error) {
    console.error("Failed to fetch data for menu page:", error);
  }

  return <MenuClient initialProducts={products} initialCategories={categories} />;
}
