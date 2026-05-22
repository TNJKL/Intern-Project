"use client";

import { useMenu } from "../hooks/useMenu";
import { FloatingNav } from "@/components/layout/FloatingNav";
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
  children: React.ReactNode;
}

export default function MenuClient({ initialProducts, initialCategories, children }: MenuClientProps) {
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
    handleCategoryChange,
  } = useMenu({ initialProducts, initialCategories });

  return (
    <div className="min-h-screen bg-[#fdfaf5] pb-24">
      <FloatingNav />
      
      {/* Header & Search & Categories */}
      <div className="bg-[#fdfaf5]/80 backdrop-blur-md sticky top-0 z-40 px-4 pt-6 pb-4 transition-all duration-300">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <MenuHeader />

            <div className="flex items-center gap-3 w-full md:w-auto relative">
              <MenuSearchBar 
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                isSearching={isSearching}
                suggestions={suggestions}
                setSuggestions={setSuggestions}
              />

              <SortDropdown 
                sortType={sortType}
                handleSortChange={handleSortChange}
                isSortOpen={isSortOpen}
                setIsSortOpen={setIsSortOpen}
              />
            </div>
          </div>

          <CategoryFilter 
            categories={categories}
            selectedMenuCategory={selectedMenuCategory}
            handleCategoryChange={handleCategoryChange}
          />
        </div>
      </div>

      {children}
    </div>
  );
}
