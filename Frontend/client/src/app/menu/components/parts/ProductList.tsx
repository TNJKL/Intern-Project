import React from "react";
import { Search } from "lucide-react";
import { Product } from "@/types/product";
import { Category } from "@/types/category";
import { ProductCard } from "./ProductCard";

interface ProductListProps {
  products: Product[];
  categories: Category[];
  isLoading: boolean;
}

export const ProductList = ({ products, categories, isLoading }: ProductListProps) => {
  return (
    <div className="max-w-7xl mx-auto px-4 mt-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
        {products.map((product, index) => (
          <ProductCard 
            key={product.id} 
            product={product} 
            index={index} 
            categories={categories} 
          />
        ))}
      </div>

      {/* Empty State */}
      {!isLoading && products.length === 0 && (
        <div className="py-20 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Không tìm thấy sản phẩm</h3>
          <p className="text-gray-500">Vui lòng thử lại với danh mục hoặc từ khóa khác</p>
        </div>
      )}
    </div>
  );
};
