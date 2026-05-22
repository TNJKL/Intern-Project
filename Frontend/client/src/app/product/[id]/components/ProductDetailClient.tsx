"use client";

import { useState, useEffect, useRef } from "react";
import { Product, ProductVariant } from "@/types/product";
import { ShoppingCart, Truck, RefreshCcw, ChevronDown, Check, X } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useCartStore } from "@/store/zustand/useCartStore";
import { useRouter } from "next/navigation";

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN').format(price);
};

export default function ProductDetailClient({ product }: { product: Product }) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [isToppingDropdownOpen, setIsToppingDropdownOpen] = useState(false);
  const toppingDropdownRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown Topping khi click ra ngoài vùng hiển thị
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toppingDropdownRef.current && !toppingDropdownRef.current.contains(event.target as Node)) {
        setIsToppingDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  const addItem = useCartStore(state => state.addItem);
  const router = useRouter();

  const prices = [
    product.price || 0,
    ...(product.variants || []).map((v: ProductVariant) => v.price)
  ].filter((p: number) => p > 0);
  
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

  const variant = product.variants?.find((v: ProductVariant) => v.id === selectedSize) || null;
  const variantPrice = variant ? variant.price : null;
  
  const selectedToppingObjs = product.toppings?.filter((t: any) => selectedToppings.includes(t.id)) || [];
  const toppingsPrice = selectedToppingObjs.reduce((sum: number, t: any) => sum + (t.price || 0), 0);

  const isExactPrice = variantPrice !== null || prices.length <= 1;
  const displayMinPrice = ((variantPrice !== null ? variantPrice : minPrice) + toppingsPrice) * quantity;
  const displayMaxPrice = (maxPrice + toppingsPrice) * quantity;

  const handleAddToCart = () => {
    if (product.variants && product.variants.length > 0 && !selectedSize) {
      toast.error("Vui lòng chọn kích cỡ");
      return false;
    }

    const addVariantPrice = variant ? variant.price : (product.price || 0);

    addItem({
      productId: product.id,
      variantId: selectedSize || "",
      quantity,
      toppingIds: selectedToppings,
      
      // UI Metadata
      name: product.name,
      image: product.imageUrl || "",
      category: "Sản phẩm", 
      sizeLabel: variant ? variant.sizeLabel : "Mặc định",
      toppings: selectedToppingObjs,
      unitPrice: addVariantPrice + toppingsPrice
    });

    toast.success("Đã thêm vào giỏ hàng");
    return true;
  };

  const handleBuyNow = () => {
    const success = handleAddToCart();
    if (success) {
      router.push('/cart');
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Price Highlight Area */}
      <div className="bg-[#fdf3eb] p-6 rounded-sm flex items-center gap-4">
        <div className="flex items-baseline gap-1 text-[#4d362b]">
          <span className="text-sm font-medium">₫</span>
          <span className="text-3xl font-bold tracking-tight">
            {formatPrice(displayMinPrice)}
          </span>
          {!isExactPrice && displayMaxPrice > displayMinPrice && (
            <>
              <span className="text-gray-400 font-light text-2xl mx-1">-</span>
              <span className="text-3xl font-bold tracking-tight">
                {formatPrice(displayMaxPrice)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Description / Summary */}
      <div className="grid grid-cols-[110px_1fr] items-start gap-4 text-sm border-b border-gray-50 pb-6">
        <span className="text-gray-500 pt-1">Mô tả</span>
        <p className="text-gray-600 leading-relaxed italic">
          {product.description || "Hương vị nguyên bản, đậm đà từ những nguyên liệu tốt nhất được chọn lọc kỹ lưỡng."}
        </p>
      </div>

      {/* Size Selection */}
      {product?.variants && product?.variants?.length > 0 && (
        <div className="grid grid-cols-[110px_1fr] items-start gap-4 text-sm">
          <span className="text-gray-500 pt-2">Kích cỡ</span>
          <div className="flex flex-wrap gap-3">
            {product.variants.map((v: ProductVariant) => (
              <button
                key={v.id}
                onClick={() => setSelectedSize(v.id)}
                className={`px-5 py-2.5 border rounded-sm transition-all text-xs font-bold ${
                  selectedSize === v.id 
                  ? "border-[#4d362b] text-[#4d362b] relative after:content-[''] after:absolute after:bottom-0 after:right-0 after:w-3 after:h-3 after:bg-[#4d362b] after:[clip-path:polygon(100%_0,0_100%,100%_100%)]" 
                  : "border-gray-200 text-gray-700 hover:border-[#4d362b] hover:text-[#4d362b]"
                }`}
              >
                Size {v.sizeLabel}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Topping Selection */}
      {product?.toppings && product?.toppings?.length > 0 && (
        <div className="grid grid-cols-[110px_1fr] items-center gap-4 text-sm relative">
          <span className="text-gray-500">Topping</span>
          <div className="relative w-full max-w-md" ref={toppingDropdownRef}>
            <button
              type="button"
              onClick={() => setIsToppingDropdownOpen(!isToppingDropdownOpen)}
              className="w-full flex items-center justify-between px-4 py-3.5 bg-[#fdfaf5] border border-[#4d362b] rounded-sm focus:outline-none transition-all text-xs font-bold text-gray-700 shadow-sm"
            >
              <span className="truncate pr-4 text-left">
                {selectedToppings.length === 0 
                  ? "Chọn Topping của bạn..." 
                  : `Đã chọn ${selectedToppings.length} loại topping: ${
                      selectedToppingObjs.map(t => t.name).join(", ")
                    }`}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${isToppingDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isToppingDropdownOpen && (
              <div className="absolute left-0 right-0 mt-1.5 bg-[#fdfaf5] border border-[#4d362b]/30 rounded-sm shadow-xl z-50 py-1.5 max-h-60 overflow-y-auto">
                {product.toppings.map((t: any) => {
                  const isSelected = selectedToppings.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setSelectedToppings((prev: string[]) => 
                          isSelected ? prev.filter((id: string) => id !== t.id) : [...prev, t.id]
                        );
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 hover:bg-[#fdf3eb]/60 text-left text-xs font-semibold transition-all ${
                        isSelected ? 'text-[#4d362b] bg-[#fdf3eb]' : 'text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-all ${
                          isSelected ? 'border-[#4d362b] bg-[#4d362b] text-white' : 'border-[#4d362b]/30 bg-[#fdfaf5]'
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span>{t.name}</span>
                      </div>
                      <span className={isSelected ? 'font-bold' : 'text-gray-400'}>
                        +₫{formatPrice(t.price)}
                      </span>
                    </button>
                  );
                })}

                {selectedToppings.length > 0 && (
                  <div className="border-t border-[#4d362b]/10 mt-1.5 px-4 pt-2.5 pb-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setSelectedToppings([])}
                      className="text-[10px] text-red-500 hover:text-red-700 font-bold uppercase tracking-wider flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      Xóa chọn tất cả
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quantity Selector */}
      <div className="grid grid-cols-[110px_1fr] items-center gap-4 text-sm mt-2">
        <span className="text-gray-500">Số lượng</span>
        <div className="flex items-center gap-4">
          <div className="flex items-center border border-gray-200 rounded-sm overflow-hidden">
            <button 
              onClick={() => setQuantity((q: number) => Math.max(1, q - 1))}
              className="w-9 h-9 flex items-center justify-center border-r border-gray-200 hover:bg-gray-50 text-xl text-gray-500"
            >
              -
            </button>
            <input 
              type="text" 
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-14 h-9 text-center border-none outline-none focus:ring-0 text-sm font-bold"
            />
            <button 
              onClick={() => setQuantity((q: number) => q + 1)}
              className="w-9 h-9 flex items-center justify-center border-l border-gray-200 hover:bg-gray-50 text-xl text-gray-500"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4 mt-8 pt-6 border-t border-gray-50">
        <button 
          onClick={handleAddToCart}
          className="px-8 py-3.5 border border-[#4d362b] bg-[#fdf3eb] text-[#4d362b] rounded-sm flex items-center gap-2 hover:bg-[#fae6d6] transition-all font-bold text-sm"
        >
          <ShoppingCart size={20} />
          Thêm Vào Giỏ Hàng
        </button>
        <button 
          onClick={handleBuyNow}
          className="px-14 py-3.5 bg-[#4d362b] text-white rounded-sm hover:bg-[#3c2a21] transition-all shadow-sm font-bold text-sm"
        >
          {isExactPrice ? `Mua Ngay - ₫${formatPrice(displayMinPrice)}` : "Mua Ngay"}
        </button>
      </div>
    </div>
  );
}
