"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Product, ProductVariant } from "@/types/product";
import { Category } from "@/types/category";
import { API_CONFIG } from "@/lib/api-config";

interface UseMenuProps {
  initialProducts: Product[];
  initialCategories: Category[];
}

export function useMenu({ initialProducts, initialCategories }: UseMenuProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Dữ liệu từ props (SSR)
  const products = initialProducts;
  const categories = initialCategories;
  
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMenuCategory, setSelectedMenuCategory] = useState<string>(searchParams.get('category') || "all");
  const [searchQuery, setSearchQuery] = useState(searchParams.get('keyword') || "");
  const [sortType, setSortType] = useState<string>(searchParams.get('sort') || "default");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  
  // Hàm cập nhật URL tập trung
  const updateUrl = (params: { category?: string; keyword?: string; sort?: string }) => {
    const newParams = new URLSearchParams(searchParams.toString());
    
    if (params.category !== undefined) {
      if (params.category === 'all') newParams.delete('category');
      else newParams.set('category', params.category);
    }
    
    if (params.keyword !== undefined) {
      if (!params.keyword) newParams.delete('keyword');
      else newParams.set('keyword', params.keyword);
    }

    if (params.sort !== undefined) {
      if (params.sort === 'default') newParams.delete('sort');
      else newParams.set('sort', params.sort);
    }

    router.push(`/menu?${newParams.toString()}`, { scroll: false });
  };

  const handleCategoryChange = (id: string) => {
    setSelectedMenuCategory(id);
    updateUrl({ category: id });
  };

  const handleSortChange = (type: string) => {
    setSortType(type);
    updateUrl({ sort: type });
    setIsSortOpen(false);
  };

  // Đồng bộ state với URL khi URL thay đổi (ví dụ: nhấn back/forward)
  useEffect(() => {
    const category = searchParams.get('category') || "all";
    const keyword = searchParams.get('keyword') || "";
    const sort = searchParams.get('sort') || "default";
    
    setSelectedMenuCategory(category);
    setSearchQuery(keyword);
    setSortType(sort);
  }, [searchParams]);

  // Debounce tìm kiếm để cập nhật URL
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery !== (searchParams.get('keyword') || "")) {
        updateUrl({ keyword: searchQuery });
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Sắp xếp sản phẩm (có thể giữ lại ở client nếu muốn sắp xếp ngay lập tức không cần load lại, 
  // nhưng ở đây chúng ta đã đẩy logic sort lên Server trong page.tsx)
  const getProductPrice = (p: Product) => {
    if (p.variants && p.variants.length > 0) {
      return Math.min(...p.variants.map((v: ProductVariant) => v.price));
    }
    return p.price || 0;
  };

  // Vẫn giữ sortedProducts ở Client để đảm bảo thứ tự hiển thị tức thì nếu cần
  const sortedProducts = useMemo(() => {
    if (sortType === 'default') return products;
    
    return [...products].sort((a, b) => {
      switch (sortType) {
        case "name-asc":
          return a.name.localeCompare(b.name, 'vi', { sensitivity: 'accent' });
        case "price-asc":
          return getProductPrice(a) - getProductPrice(b);
        case "price-desc":
          return getProductPrice(b) - getProductPrice(a);
        default:
          return (a.displayOrder || 0) - (b.displayOrder || 0);
      }
    });
  }, [products, sortType]);

  // Xử lý gợi ý tìm kiếm (Vẫn giữ ở client để tăng trải nghiệm)
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsSearching(true);
      try {
        const baseUrl = API_CONFIG.BASE_URL;
        const response = await fetch(`${baseUrl}${API_CONFIG.ENDPOINTS.SUGGESTIONS}?keyword=${encodeURIComponent(searchQuery)}&size=5`);
        const result = await response.json();
        if (result.success) {
          setSuggestions(result.data);
        }
      } catch (error) {
        console.error("Lỗi khi lấy gợi ý:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  return {
    products,
    categories,
    isLoading,
    selectedMenuCategory,
    searchQuery,
    setSearchQuery,
    sortType,
    handleSortChange,
    isSortOpen,
    setIsSortOpen,
    isSearching,
    suggestions,
    setSuggestions,
    handleCategoryChange,
    sortedProducts,
  };
}
