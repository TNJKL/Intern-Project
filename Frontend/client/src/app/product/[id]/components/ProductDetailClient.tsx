"use client";

import { useState, useEffect, useRef } from "react";
import { Product, ProductVariant } from "@/types/product";
import { ShoppingCart, ChevronDown, Check, X, Star } from "lucide-react";
import toast from "react-hot-toast";
import { useCartStore } from "@/store/zustand/useCartStore";
import { useRouter } from "next/navigation";

interface ProductDetailClientProps {
  product: Product;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN').format(price);
};

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [isToppingDropdownOpen, setIsToppingDropdownOpen] = useState(false);
  const toppingDropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const addItem = useCartStore(state => state.addItem);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toppingDropdownRef.current && !toppingDropdownRef.current.contains(event.target as Node)) {
        setIsToppingDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    if (handleAddToCart()) router.push('/cart');
  };

  return (
    <div className="w-full space-y-12">
      {/* KHỐI THÔNG TIN CHÍNH CỦA SẢN PHẨM */}
      <div className="flex flex-col gap-6 sm:gap-8 w-full max-w-full">
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight uppercase">{product.name}</h1>
          <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-500">
            <div className="flex items-center text-orange-400 gap-0.5 border-r border-gray-200 pr-3">
              <span className="font-bold text-gray-800 mr-1">4.9</span>
              {[...Array(5)].map((_, i) => <Star key={i} size={14} className="fill-current" />)}
            </div>
            <div>Đã bán <span className="font-semibold text-gray-800">120+</span></div>
          </div>
        </div>

        {/* VÙNG GIÁ BÁN */}
        <div className="bg-[#fdf3eb] p-4 sm:p-6 rounded-sm flex items-center justify-center sm:justify-start shadow-sm border border-[#4d362b]/5">
          <div className="flex flex-row flex-wrap items-baseline justify-center sm:justify-start gap-1 text-[#4d362b] w-full">
            <span className="text-xs sm:text-sm font-bold">₫</span>
            <span className="text-xl sm:text-3xl font-extrabold tracking-tight">
              {formatPrice(displayMinPrice)}
            </span>
            {!isExactPrice && displayMaxPrice > displayMinPrice && (
              <>
                <span className="text-gray-400 font-normal text-lg sm:text-2xl mx-1 self-center">-</span>
                <span className="text-xs sm:text-sm font-bold">₫</span>
                <span className="text-xl sm:text-3xl font-extrabold tracking-tight">
                  {formatPrice(displayMaxPrice)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* KHU VỰC CHỌN THUỘC TÍNH */}
        <div className="space-y-5 sm:space-y-6">
          {/* Kích cỡ */}
          {product?.variants && product?.variants?.length > 0 && (
            <div className="flex flex-col sm:grid sm:grid-cols-[110px_1fr] items-start gap-2 sm:gap-4 text-sm">
              <span className="text-gray-400 sm:text-gray-500 font-bold sm:font-normal uppercase text-xs sm:text-sm tracking-wider pt-2">Kích cỡ</span>
              <div className="flex flex-wrap gap-2.5 sm:gap-3 w-full">
                {product.variants.map((v: ProductVariant) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedSize(v.id)}
                    className={`flex-1 sm:flex-initial text-center px-5 py-2.5 border rounded-sm transition-all text-xs font-bold whitespace-nowrap min-w-[85px] ${selectedSize === v.id
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

          {/* Topping */}
          {product?.toppings && product?.toppings?.length > 0 && (
            <div className="flex flex-col sm:grid sm:grid-cols-[110px_1fr] items-start sm:items-center gap-2 sm:gap-4 text-sm relative">
              <span className="text-gray-400 sm:text-gray-500 font-bold sm:font-normal uppercase text-xs sm:text-sm tracking-wider">Topping</span>
              <div className="relative w-full max-w-full sm:max-w-md" ref={toppingDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsToppingDropdownOpen(!isToppingDropdownOpen)}
                  className="w-full flex items-center justify-between px-4 py-3.5 bg-[#fdfaf5] border border-[#4d362b] rounded-sm focus:outline-none text-xs font-bold text-gray-700 shadow-sm"
                >
                  <span className="truncate pr-4 text-left">
                    {selectedToppings.length === 0 ? "Chọn Topping của bạn..." : `Đã chọn ${selectedToppings.length} loại topping...`}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isToppingDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isToppingDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1.5 bg-[#fdfaf5] border border-[#4d362b]/30 rounded-sm shadow-xl z-50 py-1.5 max-h-60 overflow-y-auto w-full">
                    {product.toppings.map((t: any) => {
                      const isSelected = selectedToppings.includes(t.id);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setSelectedToppings((prev: string[]) => isSelected ? prev.filter((id: string) => id !== t.id) : [...prev, t.id]);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-3 text-left text-xs font-semibold ${isSelected ? 'text-[#4d362b] bg-[#fdf3eb]' : 'text-gray-700'}`}
                        >
                          <div className="flex items-center gap-2.5 w-3/4">
                            <div className={`w-4 h-4 border flex items-center justify-center shrink-0 ${isSelected ? 'border-[#4d362b] bg-[#4d362b] text-white' : 'border-[#4d362b]/30'}`}>
                              {isSelected && <Check className="w-2.5 h-2.5" />}
                            </div>
                            <span className="truncate">{t.name}</span>
                          </div>
                          <span>+₫{formatPrice(t.price)}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Số lượng */}
          <div className="flex flex-col sm:grid sm:grid-cols-[110px_1fr] items-start sm:items-center gap-2 sm:gap-4 text-sm">
            <span className="text-gray-400 sm:text-gray-500 font-bold sm:font-normal uppercase text-xs sm:text-sm tracking-wider">Số lượng</span>
            <div className="flex items-center border border-gray-200 rounded-sm overflow-hidden">
              <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="w-9 h-9 border-r border-gray-200 hover:bg-gray-50 text-xl text-gray-500">-</button>
              <input type="text" value={quantity} readOnly className="w-14 h-9 text-center border-none outline-none text-sm font-normal text-gray-700" />
              <button type="button" onClick={() => setQuantity((q) => q + 1)} className="w-9 h-9 border-l border-gray-200 hover:bg-gray-50 text-xl text-gray-500">+</button>
            </div>
          </div>

          {/* Mô tả sản phẩm */}
          <div className="flex flex-col sm:grid sm:grid-cols-[110px_1fr] items-start gap-1.5 sm:gap-4 text-sm border-t border-gray-50 pt-5 mt-2">
            <span className="text-gray-400 sm:text-gray-500 font-bold sm:font-normal uppercase text-xs sm:text-sm tracking-wider pt-0.5">Mô tả</span>
            <p className="text-gray-600 leading-relaxed italic">
              {product.description || "Hương vị nguyên bản, đậm đà từ những nguyên liệu tốt nhất được chọn lọc kỹ lưỡng."}
            </p>
          </div>
        </div>

        {/* NÚT BẤM MUA HÀNG */}
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mt-4 pt-6 border-t border-gray-50 w-full">
          <button
            type="button"
            onClick={handleAddToCart}
            className="w-full sm:w-auto px-8 py-3.5 border border-[#4d362b] bg-[#fdf3eb] text-[#4d362b] rounded-sm flex items-center justify-center gap-2 hover:bg-[#fae6d6] font-bold text-sm shrink-0"
          >
            <ShoppingCart size={20} /> Thêm Vào Giỏ Hàng
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            className="w-full sm:w-auto sm:flex-1 py-3.5 bg-[#4d362b] text-white rounded-sm hover:bg-[#3c2a21] font-bold text-sm text-center"
          >
            {isExactPrice ? `Mua Ngay - ₫${formatPrice(displayMinPrice)}` : "Mua Ngay"}
          </button>
        </div>
      </div>
    </div>
  );
}