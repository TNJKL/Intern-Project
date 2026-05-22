"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
  
  const categories = initialCategories;
  
  // Quản lý danh sách sản phẩm, trang hiện tại, và trạng thái tải thêm từ DB bằng state
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(initialProducts.length === 10);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Khóa chống trùng lặp request khi cuộn nhanh (Concurrent request protection)
  const isLoadingMoreRef = useRef(false);
  const fetchedPagesRef = useRef<Set<number>>(new Set([0]));
  
  const [selectedMenuCategory, setSelectedMenuCategory] = useState<string>(searchParams.get('category') || "all");
  const [searchQuery, setSearchQuery] = useState(searchParams.get('keyword') || "");
  const [sortType, setSortType] = useState<string>(searchParams.get('sort') || "default");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Đồng bộ lại state khi initialProducts từ Server-Side thay đổi (khi bấm chuyển danh mục/tìm kiếm)
  useEffect(() => {
    setProducts(initialProducts);
    setPage(0);
    setHasMore(initialProducts.length === 10);
    fetchedPagesRef.current = new Set([0]);
    isLoadingMoreRef.current = false;
  }, [initialProducts]);
  
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
        case "name-desc":
          return b.name.localeCompare(a.name, 'vi', { sensitivity: 'accent' });
        case "price-asc":
          return getProductPrice(a) - getProductPrice(b);
        case "price-desc":
          return getProductPrice(b) - getProductPrice(a);
        default:
          return (a.displayOrder || 0) - (b.displayOrder || 0);
      }
    });
  }, [products, sortType]);

  // Xử lý gợi ý tìm kiếm — Hiện ngay khi focus, cập nhật realtime khi gõ
  const fetchSuggestions = async (query: string) => {
    setIsSearching(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const trimmed = query.trim();
      const url = trimmed
        ? `${baseUrl}${API_CONFIG.ENDPOINTS.SUGGESTIONS}?keyword=${encodeURIComponent(trimmed)}&size=8`
        : `${baseUrl}${API_CONFIG.ENDPOINTS.SUGGESTIONS}?size=8`;
      const response = await fetch(url);
      const result = await response.json();
      if (result.success) {
        setSuggestions(result.data);
      }
    } catch (error) {
      console.warn("Lỗi khi lấy gợi ý:", error);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (!showSuggestions) return;
    const timeoutId = setTimeout(() => fetchSuggestions(searchQuery), 200);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, showSuggestions]);

  const handleSearchFocus = () => {
    setIsFocused(true);
    setShowSuggestions(true);
    fetchSuggestions(searchQuery);
  };

  const handleSearchBlur = () => {
    // Delay để cho phép click vào suggestion trước khi ẩn
    setTimeout(() => {
      setIsFocused(false);
      setShowSuggestions(false);
      setSuggestions([]);
    }, 150);
  };

  // Hàm tải thêm sản phẩm bằng cách Query trực tiếp vào Database
  const loadMore = async () => {
    if (isLoadingMore || !hasMore || isLoadingMoreRef.current) return;
    
    const nextPage = page + 1;
    if (fetchedPagesRef.current.has(nextPage)) return;
    
    // Đặt khóa chống gọi trùng lặp song song
    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    fetchedPagesRef.current.add(nextPage);
    
    try {
      const categoryId = searchParams.get('category') || "all";
      const keyword = searchParams.get('keyword') || "";
      const sortParam = searchParams.get('sort') || "default";
      
      const queryParams = new URLSearchParams();
      queryParams.append("page", nextPage.toString());
      queryParams.append("size", "10");
      queryParams.append("isAvailable", "true");
      queryParams.append("includeDeleted", "false");

      if (sortParam === "name-asc") {
        queryParams.append("sort", "name,asc");
        queryParams.append("sort", "createdAt,asc");
      } else if (sortParam === "name-desc") {
        queryParams.append("sort", "name,desc");
        queryParams.append("sort", "createdAt,asc");
      } else {
        queryParams.append("sort", "displayOrder,asc");
        queryParams.append("sort", "createdAt,asc");
      }
      
      if (categoryId && categoryId !== "all") {
        queryParams.append("categoryId", categoryId);
      }
      if (keyword) {
        queryParams.append("keyword", keyword);
      }
      
      const response = await fetch(`/api/v1/products?${queryParams.toString()}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const allData = Array.isArray(result.data) ? result.data : (result.data?.data || []);
          const nextProducts = allData.filter((p: any) => 
            !(p.isDeleted || p.deleted || p.deletedAt) && p.isAvailable === true
          );
          
          if (nextProducts.length > 0) {
            setProducts((prev) => {
              // Lọc bỏ bất kỳ sản phẩm nào trùng lặp khóa ID (Double-key prevention)
              const existingIds = new Set(prev.map((p: Product) => p.id));
              const uniqueNext = nextProducts.filter((p: Product) => !existingIds.has(p.id));
              return [...prev, ...uniqueNext];
            });
            setPage(nextPage);
            setHasMore(allData.length === 10);
          } else {
            setHasMore(false);
          }
        } else {
          setHasMore(false);
          fetchedPagesRef.current.delete(nextPage);
        }
      } else {
        setHasMore(false);
        fetchedPagesRef.current.delete(nextPage);
      }
    } catch (error) {
      console.error("Lỗi khi tải thêm sản phẩm từ DB:", error);
      setHasMore(false);
      fetchedPagesRef.current.delete(nextPage);
    } finally {
      setIsLoadingMore(false);
      isLoadingMoreRef.current = false;
    }
  };

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
    showSuggestions,
    handleSearchFocus,
    handleSearchBlur,
    handleCategoryChange,
    sortedProducts,
    hasMore,
    loadMore,
    isLoadingMore,
  };
}
