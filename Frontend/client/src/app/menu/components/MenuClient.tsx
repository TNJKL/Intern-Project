"use client";

import { useMenu } from "../hooks/useMenu";
import { MenuHeader } from "./parts/MenuHeader";
import { MenuSearchBar } from "./parts/MenuSearchBar";
import { SortDropdown } from "./parts/SortDropdown";
import { CategoryFilter } from "./parts/CategoryFilter";
import { ProductList } from "./parts/ProductList";
import { Product } from "@/types/product";
import { Category } from "@/types/category";

interface MenuClientProps {
  initialProducts: Product[];
  initialCategories: Category[];
}

export default function MenuClient({ initialProducts, initialCategories }: MenuClientProps) {
  const {
    categories,
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
    isLoading,
  } = useMenu({ initialProducts, initialCategories });

  return (
    <div className="min-h-screen bg-[#fdf3eb]/30 pb-24 transition-colors duration-300">

      {/* 1. Phần Tiêu đề chính (Nền tĩnh - Sẽ cuộn mất khi kéo xuống giúp giải phóng không gian) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-2">
        <MenuHeader />
      </div>

      {/* 2. Phần Thanh Công cụ & Danh mục Bộ lọc (Sticky - Ghim chặt trên cùng khi cuộn trang) */}
      <div className="sticky top-[72px] z-30 bg-[#fdf3eb]/80 backdrop-blur-md border-b border-[#91461e]/5 transition-all duration-300 shadow-[0_4px_30px_-20px_rgba(145,70,30,0.05)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4">

          {/* Ô Tìm Kiếm và Bộ Sắp Xếp hàng ngang */}
          <div className="flex items-center gap-3 w-full relative">
            <div className="flex-1 min-w-0">
              <MenuSearchBar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                isSearching={isSearching}
                suggestions={suggestions}
                setSuggestions={setSuggestions}
                showSuggestions={showSuggestions}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
              />
            </div>

            <div className="shrink-0">
              <SortDropdown
                sortType={sortType}
                handleSortChange={handleSortChange}
                isSortOpen={isSortOpen}
                setIsSortOpen={setIsSortOpen}
              />
            </div>
          </div>

          {/* Thanh trượt chọn danh mục món ăn */}
          <div className="pt-1">
            <CategoryFilter
              categories={categories}
              selectedMenuCategory={selectedMenuCategory}
              handleCategoryChange={handleCategoryChange}
            />
          </div>

        </div>
      </div>

      {/* 3. Khu vực hiển thị danh sách sản phẩm (Infinite Scroll) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        <ProductList
          products={sortedProducts}
          categories={categories}
          isLoading={isLoading}
          hasMore={hasMore}
          loadMore={loadMore}
          isLoadingMore={isLoadingMore}
        />
      </div>

    </div>
  );
}