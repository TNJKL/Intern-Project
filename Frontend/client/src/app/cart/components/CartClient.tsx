"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ArrowRight, Ticket, ChevronLeft, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/store/useCartStore";
import { voucherService } from "@/services/voucher.service";
import type { ValidateVoucherResult } from "@/services/voucher.service";
import toast from "react-hot-toast";

export default function CartClient() {
  const { items: cartItems, updateQuantity, removeItem } = useCartStore();
  
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<ValidateVoucherResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [suggestedVoucher, setSuggestedVoucher] = useState("GIAM10");
  const [mounted, setMounted] = useState(false);

  // Tính toán tạm tính
  const subTotal = cartItems.reduce((total, item) => total + (item.unitPrice * item.quantity), 0);

  useEffect(() => {
    setMounted(true);
    
    // Tải danh sách voucher để gợi ý mã thực tế đang có hiệu lực
    voucherService.getVouchers()
      .then(res => {
        if (res.success && res.data && res.data.length > 0) {
          const now = new Date();
          const active = res.data.find(v => {
            const validFrom = new Date(v.validFrom);
            const validUntil = v.validUntil ? new Date(v.validUntil) : null;
            const hasStarted = now >= validFrom;
            const hasNotExpired = !validUntil || now <= validUntil;
            const hasUsageLeft = v.currentUsageCount < v.maxUsageCount;
            return v.isActive && hasStarted && hasNotExpired && hasUsageLeft;
          });
          if (active) {
            setSuggestedVoucher(active.code);
          }
        }
      })
      .catch(err => console.error("Lỗi khi tải gợi ý voucher", err));
  }, []);

  // Tự động quản lý voucher (khôi phục & cập nhật theo giỏ hàng)
  useEffect(() => {
    if (!mounted) return;

    const savedVoucherCode = localStorage.getItem('brewtra_applied_voucher');
    
    // TH1: Có voucher lưu trữ nhưng chưa được áp dụng vào state, và giỏ hàng đã có sản phẩm (tránh race condition khi Zustand chưa nạp xong)
    if (savedVoucherCode && !appliedVoucher && subTotal > 0) {
      setVoucherCode(savedVoucherCode);
      voucherService.validateVoucher(savedVoucherCode, subTotal)
        .then(res => {
          if (res.success && res.data && res.data.valid) {
            setAppliedVoucher(res.data);
          } else {
            localStorage.removeItem('brewtra_applied_voucher');
          }
        })
        .catch(() => {
          localStorage.removeItem('brewtra_applied_voucher');
        });
    }
    
    // TH2: Đã có voucher trong state, cần tự động cập nhật lại khi subTotal thay đổi
    if (appliedVoucher && subTotal > 0) {
      voucherService.validateVoucher(appliedVoucher.code, subTotal)
        .then(res => {
          if (res.success && res.data) {
            setAppliedVoucher(res.data);
            if (!res.data.valid) {
              localStorage.removeItem('brewtra_applied_voucher');
            } else {
              localStorage.setItem('brewtra_applied_voucher', res.data.code);
            }
          }
        })
        .catch(() => {
          setAppliedVoucher(null);
          localStorage.removeItem('brewtra_applied_voucher');
        });
    }

    // TH3: Giỏ hàng trống
    if (appliedVoucher && subTotal === 0) {
      setAppliedVoucher(null);
      localStorage.removeItem('brewtra_applied_voucher');
    }
  }, [subTotal, mounted]);

  // Áp dụng voucher
  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      toast.error("Vui lòng nhập mã giảm giá!");
      return;
    }
    
    setIsValidating(true);
    try {
      const res = await voucherService.validateVoucher(voucherCode.trim().toUpperCase(), subTotal);
      if (res.success && res.data) {
        const result = res.data;
        setAppliedVoucher(result);
        
        if (result.valid) {
          localStorage.setItem('brewtra_applied_voucher', result.code);
          toast.success(`Áp dụng mã ${result.code} thành công!`);
        } else {
          toast.error(result.message || "Mã giảm giá không hợp lệ.");
          localStorage.removeItem('brewtra_applied_voucher');
        }
      } else {
        toast.error(res.message || "Mã giảm giá không hợp lệ.");
        setAppliedVoucher(null);
        localStorage.removeItem('brewtra_applied_voucher');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Mã giảm giá không hợp lệ hoặc đã hết hạn.");
      setAppliedVoucher(null);
      localStorage.removeItem('brewtra_applied_voucher');
    } finally {
      setIsValidating(false);
    }
  };

  // Gỡ voucher
  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode("");
    localStorage.removeItem('brewtra_applied_voucher');
    toast.success("Đã gỡ mã giảm giá");
  };

  // Tính toán số tiền được giảm từ backend trả về
  const discountAmount = appliedVoucher && appliedVoucher.valid ? (appliedVoucher.discountAmount || 0) : 0;
  const total = Math.max(0, subTotal - discountAmount);

  if (!mounted) return <div className="min-h-screen bg-[#fcf9f2]"></div>;

  return (
    <div className="min-h-screen bg-[#fcf9f2] pb-32">
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/menu" className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tight">Giỏ hàng của bạn</h1>
          <div className="ml-auto bg-primary/10 text-primary px-4 py-2 rounded-full font-bold text-sm">
            {cartItems.length} sản phẩm
          </div>
        </div>

        {cartItems.length === 0 ? (
          // Trạng thái trống (Empty State)
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[50vh]">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <ShoppingBag className="w-12 h-12 text-gray-300" />
            </div>
            <h2 className="text-2xl font-black text-gray-800 mb-2">Giỏ hàng đang trống</h2>
            <p className="text-gray-500 mb-8 max-w-md">Có vẻ như bạn chưa chọn món đồ uống nào. Hãy quay lại thực đơn để khám phá các hương vị tuyệt vời nhé!</p>
            <Link href="/menu" className="bg-primary text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-primary/30 hover:bg-coffee-dark transition-all active:scale-95 uppercase tracking-widest text-sm">
              Xem Thực Đơn Ngay
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Danh sách sản phẩm */}
            <div className="lg:col-span-2 space-y-4">
              <AnimatePresence>
                {cartItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, x: -20 }}
                    className="bg-white rounded-3xl p-4 flex flex-col sm:flex-row gap-4 sm:items-center shadow-sm border border-transparent hover:border-gray-100 transition-colors"
                  >
                    {/* Hình ảnh */}
                    <div className="w-24 h-24 bg-[#fdfaf5] rounded-2xl overflow-hidden relative shrink-0">
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    </div>

                    {/* Thông tin */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <p className="text-[10px] text-primary/60 font-black uppercase tracking-widest">{item.category}</p>
                          <h3 className="font-bold text-lg text-gray-800 leading-tight">{item.name}</h3>
                        </div>
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-500 mb-1">Size: {item.sizeLabel}</p>
                      {item.toppings && item.toppings.length > 0 && (
                        <p className="text-xs text-gray-400 mb-3">
                          + {item.toppings.map(t => t.name).join(", ")}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="font-black text-coffee-dark text-lg">
                          {item.unitPrice.toLocaleString('vi-VN')}đ
                        </span>
                        
                        {/* Bộ đếm số lượng */}
                        <div className="flex items-center gap-3 bg-gray-50 p-1 rounded-full border border-gray-100">
                          <button 
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm text-gray-600 hover:text-primary active:scale-90 transition-all"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-bold text-gray-800 w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm text-gray-600 hover:text-primary active:scale-90 transition-all"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Tổng kết đơn hàng (Order Summary) */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl p-6 shadow-sm sticky top-24">
                <h3 className="text-lg font-black text-gray-800 uppercase mb-6">Tóm tắt đơn hàng</h3>
                
                {/* Mã giảm giá */}
                <div className="mb-6">
                  <div className="flex gap-2 relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                      <Ticket className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="Nhập mã giảm giá..."
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                      className="flex-1 bg-gray-50 border border-gray-100 text-gray-800 text-sm font-bold rounded-xl pl-10 pr-4 py-3 outline-none focus:bg-white focus:border-primary/50 transition-all uppercase placeholder:normal-case placeholder:font-medium"
                    />
                    <button 
                      onClick={handleApplyVoucher}
                      className="bg-gray-800 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-black transition-colors"
                    >
                      Áp dụng
                    </button>
                  </div>
                  {appliedVoucher && !appliedVoucher.valid && (
                    <p className="text-red-500 text-xs font-bold mt-2 ml-2 leading-relaxed">
                      ⚠ {appliedVoucher.message}
                    </p>
                  )}
                  {appliedVoucher && appliedVoucher.valid && (
                    <div className="flex justify-between items-center mt-2 ml-2">
                      <p className="text-green-600 text-xs font-bold flex items-center gap-1">
                        <span>✓</span> {appliedVoucher.message || `Áp dụng thành công mã: ${appliedVoucher.code}`}
                      </p>
                      <button 
                        onClick={handleRemoveVoucher} 
                        className="text-xs text-red-500 hover:text-red-700 font-bold underline cursor-pointer"
                      >
                        Gỡ
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-4 text-sm font-medium text-gray-500 border-t border-gray-100 pt-6 mb-6">
                  <div className="flex justify-between">
                    <span>Tạm tính</span>
                    <span className="text-gray-800 font-bold">{subTotal.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phí giao hàng</span>
                    <span className="text-gray-800 font-bold">Chưa tính</span>
                  </div>
                  {appliedVoucher && appliedVoucher.valid && (
                    <div className="flex justify-between text-green-600">
                      <span>Khuyến mãi ({appliedVoucher.code})</span>
                      <span className="font-bold">-{discountAmount.toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-6 mb-8">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-gray-500 uppercase">Tổng cộng</span>
                    <span className="text-2xl font-black text-primary">
                      {total.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                  <p className="text-[10px] text-right text-gray-400 mt-1">(Đã bao gồm VAT nếu có)</p>
                </div>

                <Link href="/checkout" className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-coffee-dark shadow-lg shadow-primary/30 transition-all active:scale-[0.98] group">
                  Tiến hành thanh toán
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>

                <p className="text-center text-xs text-gray-400 mt-4">Gợi ý mã: <strong className="text-gray-600 cursor-pointer hover:underline" onClick={() => setVoucherCode(suggestedVoucher)}>{suggestedVoucher}</strong></p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
