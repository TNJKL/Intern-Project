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
    <div className="w-full lg:grow flex flex-col justify-between gap-8">
      {/* KHỐI THÔNG TIN CHÍNH CỦA SẢN PHẨM */}
      <div className="flex flex-col gap-5 sm:gap-6 w-full max-w-full">
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
        <div className="bg-secondary p-4 sm:p-6 rounded-2xl flex items-center justify-center sm:justify-start shadow-sm border border-coffee-dark/5">
          <div className="flex flex-row flex-wrap items-baseline justify-center sm:justify-start gap-1 text-coffee-dark w-full">
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
                    className={`flex-1 sm:flex-initial text-center px-5 py-2.5 border rounded-xl transition-all text-xs font-bold whitespace-nowrap min-w-[85px] ${selectedSize === v.id
                      ? "border-2 border-coffee-dark bg-secondary text-coffee-dark font-extrabold shadow-sm scale-[1.02]"
                      : "border-gray-200 text-gray-700 hover:border-coffee-dark/40 hover:bg-stone-50/50 bg-white"
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
            <div className="flex flex-col sm:grid sm:grid-cols-[110px_1fr] items-start gap-2 sm:gap-4 text-sm relative">
              <span className="text-gray-400 sm:text-gray-500 font-bold sm:font-normal uppercase text-xs sm:text-sm tracking-wider pt-3.5">Topping</span>
              <div className="relative w-full max-w-full sm:max-w-md" ref={toppingDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsToppingDropdownOpen(!isToppingDropdownOpen)}
                  className="w-full flex items-center justify-between px-4 py-3.5 bg-background border border-coffee-dark rounded-xl focus:outline-none text-xs font-bold text-gray-700 shadow-sm"
                >
                  <span className="truncate pr-4 text-left">
                    {selectedToppings.length === 0 ? "Chọn Topping của bạn..." : `Đã chọn ${selectedToppings.length} loại topping...`}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isToppingDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isToppingDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1.5 bg-background border border-coffee-dark/30 rounded-xl shadow-xl z-50 py-1.5 max-h-60 overflow-y-auto w-full">
                    {product.toppings.map((t: any) => {
                      const isSelected = selectedToppings.includes(t.id);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setSelectedToppings((prev: string[]) => isSelected ? prev.filter((id: string) => id !== t.id) : [...prev, t.id]);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-3 text-left text-xs font-semibold ${isSelected ? 'text-coffee-dark bg-secondary' : 'text-gray-700'}`}
                        >
                          <div className="flex items-center gap-2.5 w-3/4">
                            <div className={`w-4 h-4 border flex items-center justify-center shrink-0 rounded ${isSelected ? 'border-coffee-dark bg-coffee-dark text-white' : 'border-coffee-dark/30'}`}>
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

                {/* HIỂN THỊ CÁC TOPPING ĐÃ CHỌN */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5 w-full min-h-[32px]">
                  {selectedToppingObjs.length > 0 ? (
                    selectedToppingObjs.map((t: any) => (
                      <div
                        key={t.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary text-coffee-dark text-[10px] font-extrabold uppercase rounded-full border border-coffee-dark/15 shadow-sm"
                      >
                        <span>{t.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedToppings((prev: string[]) => prev.filter((id) => id !== t.id));
                          }}
                          className="hover:text-red-600 transition-colors p-0.5 flex items-center justify-center"
                          title={`Hủy chọn ${t.name}`}
                        >
                          <X className="w-3 h-3 stroke-[2.5]" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <span className="text-[11px] text-gray-400/80 italic font-semibold select-none">
                      Chưa chọn topping
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Số lượng */}
          <div className="flex flex-col sm:grid sm:grid-cols-[110px_1fr] items-start sm:items-center gap-2 sm:gap-4 text-sm">
            <span className="text-gray-400 sm:text-gray-500 font-bold sm:font-normal uppercase text-xs sm:text-sm tracking-wider">Số lượng</span>
            <div className="flex items-center border border-coffee-dark/20 rounded-xl overflow-hidden bg-white shadow-sm">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-9 h-9 border-r border-coffee-dark/10 bg-secondary text-coffee-dark hover:bg-secondary/80 text-xl font-bold transition-all duration-200 flex items-center justify-center"
              >
                -
              </button>
              <input
                type="text"
                value={quantity}
                readOnly
                className="w-14 h-9 text-center border-none outline-none text-sm font-extrabold text-coffee-dark bg-transparent"
              />
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-9 h-9 border-l border-coffee-dark/10 bg-secondary text-coffee-dark hover:bg-secondary/80 text-xl font-bold transition-all duration-200 flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>

          {/* Mô tả sản phẩm */}
          <div className="flex flex-col sm:grid sm:grid-cols-[110px_1fr] items-start gap-1.5 sm:gap-4 text-sm border-t border-gray-50 pt-5 mt-2">
            <span className="text-gray-400 sm:text-gray-500 font-bold sm:font-normal uppercase text-xs sm:text-sm tracking-wider pt-0.5">Mô tả</span>
            <p className="text-gray-600 leading-relaxed italic">
              {product.description || "Hương vị nguyên bản, đậm đà từ những nguyên liệu tốt nhất được chọn lọc kỹ lưuỡng."}
            </p>
          </div>
        </div>
      </div>

      {/* NÚT BẤM MUA HÀNG */}
      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 pt-6 border-t border-gray-200 w-full mt-auto">
        <button
          type="button"
          onClick={handleAddToCart}
          className="w-full sm:w-auto px-8 py-3.5 border border-coffee-dark bg-secondary text-coffee-dark rounded-xl flex items-center justify-center gap-2 font-bold text-sm shrink-0 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] hover:shadow-md hover:bg-secondary/80"
        >
          <ShoppingCart size={20} /> Thêm Vào Giỏ Hàng
        </button>
        <button
          type="button"
          onClick={handleBuyNow}
          className="w-full sm:w-auto sm:flex-1 py-3.5 bg-coffee-dark text-white rounded-xl font-bold text-sm text-center transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] hover:shadow-md hover:bg-coffee-dark/90"
        >
          {isExactPrice ? `Mua Ngay - ₫${formatPrice(displayMinPrice)}` : "Mua Ngay"}
        </button>
      </div>
    </div>
  );
}