"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ArrowRight, ChevronLeft, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/store/zustand/useCartStore";
import { useAuthStore } from "@/store/zustand/useAuthStore";

export default function CartClient() {
  const { items: cartItems, updateQuantity, removeItem } = useCartStore();
  const { user } = useAuthStore();

  const [mounted, setMounted] = useState(false);

  // Tính toán tạm tính
  const subTotal = cartItems.reduce((total, item) => total + (item.unitPrice * item.quantity), 0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const total = subTotal;

  if (!mounted) return <div className="min-h-screen bg-[#fcf9f2]"></div>;

  return (
    <div className="min-h-screen bg-[#fcf9f2] pb-24 md:pb-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 md:pt-8 pb-12">

        {/* Header */}
        <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
          <Link href="/menu" className="w-9 h-9 md:w-10 md:h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors">
            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
          </Link>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-800 uppercase tracking-tight">
            Giỏ hàng <span className="hidden xs:inline">của bạn</span>
          </h1>
          <div className="ml-auto bg-primary/10 text-primary px-3 py-1.5 md:px-4 md:py-2 rounded-full font-bold text-xs md:text-sm whitespace-nowrap">
            {cartItems.length} sản phẩm
          </div>
        </div>

        {cartItems.length === 0 ? (
          /* Trạng thái trống (Empty State) */
          <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[40vh] md:min-h-[50vh]">
            <div className="w-16 h-16 md:w-24 md:h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4 md:mb-6">
              <ShoppingBag className="w-8 h-8 md:w-12 md:h-12 text-gray-300" />
            </div>
            <h2 className="text-xl md:text-2xl font-black text-gray-800 mb-2">Giỏ hàng đang trống</h2>
            <p className="text-sm md:text-base text-gray-500 mb-6 md:mb-8 max-w-md px-2">
              Có vẻ như bạn chưa chọn món đồ uống nào. Hãy quay lại thực đơn để khám phá các hương vị tuyệt vời nhé!
            </p>
            <Link href="/menu" className="w-full sm:w-auto text-center bg-primary text-white px-6 py-3.5 md:px-8 md:py-4 rounded-full font-bold shadow-lg shadow-primary/30 hover:bg-coffee-dark transition-all active:scale-95 uppercase tracking-widest text-xs md:text-sm">
              Xem Thực Đơn Ngay
            </Link>
          </div>
        ) : (
          /* Layout chính thức */
          /* FIX: Đổi từ xl:grid-cols-3 thành lg:grid-cols-3 để hiển thị 2 cột trên iPad Pro */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">

            {/* Danh sách sản phẩm */}
            {/* FIX: Đổi từ xl:col-span-2 thành lg:col-span-2 */}
            <div className="lg:col-span-2 space-y-3 md:space-y-4">
              <AnimatePresence>
                {cartItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, x: -20 }}
                    className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-5 flex flex-row gap-4 items-center shadow-sm border border-transparent hover:border-gray-100 transition-colors"
                  >
                    {/* Hình ảnh - Tối ưu kích thước linh hoạt theo thiết bị */}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-[#fdfaf5] rounded-xl md:rounded-2xl overflow-hidden relative shrink-0">
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    </div>

                    {/* Thông tin sản phẩm */}
                    <div className="flex-1 min-w-0 h-full flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <div className="min-w-0">
                            <p className="text-[10px] md:text-xs text-primary/60 font-black uppercase tracking-widest truncate">{item.category}</p>
                            <h3 className="font-bold text-sm sm:text-base md:text-xl text-gray-800 leading-snug truncate">{item.name}</h3>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors shrink-0"
                          >
                            <Trash2 className="w-4 h-4 md:w-5 h-5" />
                          </button>
                        </div>

                        <p className="text-xs md:text-sm text-gray-500 mb-1">Size: {item.sizeLabel}</p>

                        {item.toppings && item.toppings.length > 0 && (
                          <p className="text-xs text-gray-400 mb-2 truncate">
                            + {item.toppings.map(t => t.name).join(", ")}
                          </p>
                        )}
                      </div>

                      {/* Khu vực giá tiền và bộ đếm số lượng */}
                      <div className="flex flex-row items-center justify-between gap-2 mt-2 w-full">
                        <span className="font-black text-coffee-dark text-base sm:text-lg md:text-xl">
                          {item.unitPrice.toLocaleString('vi-VN')}đ
                        </span>

                        <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-full border border-gray-100 shadow-sm">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center bg-white rounded-full shadow-sm text-gray-600 hover:text-primary active:scale-90 transition-all"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-bold text-sm md:text-base text-gray-800 w-6 text-center select-none">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center bg-white rounded-full shadow-sm text-gray-600 hover:text-primary active:scale-90 transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Tổng kết đơn hàng (Order Summary) */}
            {/* FIX: Đổi từ xl:col-span-1 sang lg:col-span-1 và tinh chỉnh thuộc tính sticky */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-sm lg:sticky lg:top-24">
                <h3 className="text-base md:text-lg font-black text-gray-800 uppercase mb-4 md:mb-6">Tóm tắt đơn hàng</h3>

                <div className="space-y-3.5 text-xs md:text-sm font-medium text-gray-500 mb-4 md:mb-6">
                  <div className="flex justify-between">
                    <span>Tạm tính</span>
                    <span className="text-gray-800 font-bold">{subTotal.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phí giao hàng</span>
                    <span className="text-gray-800 font-bold">Chưa tính</span>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 md:pt-6 mb-6 md:mb-8">
                  <div className="flex justify-between items-end">
                    <span className="text-xs md:text-sm font-bold text-gray-500 uppercase">Tổng cộng</span>
                    <span className="text-xl md:text-2xl font-black text-primary">
                      {total.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                  <p className="text-[10px] text-right text-gray-400 mt-1">(Đã bao gồm VAT nếu có)</p>
                </div>

                <Link href="/checkout" className="w-full bg-primary text-white py-3.5 md:py-4 rounded-xl md:rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-coffee-dark shadow-lg shadow-primary/30 transition-all active:scale-[0.98] group text-xs md:text-sm">
                  Tiến hành thanh toán
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}