"use client";

import { useEffect, useState } from "react";
import { Ticket, Copy, Check, Sparkles, Clock, Calendar, ArrowRight, ShieldCheck, RefreshCw, ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { voucherService } from "@/services/voucher.service";
import type { Voucher } from "@/services/voucher.service";
import { useCartStore } from "@/store/useCartStore";
import toast from "react-hot-toast";
import Link from "next/link";
import Image from "next/image";

export default function OffersClient({ initialVouchers = [] }: { initialVouchers?: Voucher[] }) {
  const { items: cartItems } = useCartStore();
  const [vouchers, setVouchers] = useState<Voucher[]>(initialVouchers);
  const [loading, setLoading] = useState(initialVouchers.length === 0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'PERCENTAGE' | 'FIXED_AMOUNT'>('ALL');

  // Tính tạm tính giỏ hàng hiện tại để xem voucher nào đủ điều kiện áp dụng luôn
  const subTotal = cartItems.reduce((total, item) => total + (item.unitPrice * item.quantity), 0);

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const res = await voucherService.getVouchers();
      if (res.success) {
        // Lọc hiển thị các voucher đang kích hoạt
        setVouchers(res.data || []);
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách voucher", err);
      toast.error("Không thể tải danh sách ưu đãi. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialVouchers.length === 0) {
      fetchVouchers();
    }
  }, [initialVouchers]);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Đã sao chép mã: ${code}`);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  const handleApplyQuickly = (code: string) => {
    localStorage.setItem('brewtra_applied_voucher', code);
    toast.success(`Đã áp dụng nhanh mã ${code} vào giỏ hàng!`);
  };

  // Lọc voucher
  const filteredVouchers = vouchers.filter(v => {
    if (filterType === 'ALL') return true;
    return v.discountType === filterType;
  });

  // Tách voucher còn hiệu lực và hết hiệu lực
  const activeVouchers = filteredVouchers.filter(v => {
    const now = new Date();
    const validFrom = new Date(v.validFrom);
    const validUntil = v.validUntil ? new Date(v.validUntil) : null;
    const hasStarted = now >= validFrom;
    const hasNotExpired = !validUntil || now <= validUntil;
    const hasUsageLeft = v.currentUsageCount < v.maxUsageCount;
    return v.isActive && hasStarted && hasNotExpired && hasUsageLeft;
  });

  const expiredVouchers = filteredVouchers.filter(v => !activeVouchers.includes(v));

  return (
    <div className="min-h-screen bg-[#fcf9f2] pb-32">
      {/* Hero Banner Section */}
      <div className="relative bg-gradient-to-br from-[#2e1f16] to-[#120a06] text-white pt-20 pb-28 px-6 overflow-hidden rounded-b-[50px] shadow-xl">
        {/* Background decorative textures */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="absolute -top-10 -right-10 w-60 h-60 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-primary/10 rounded-full blur-3xl"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-primary/20 text-primary border border-primary/30 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-6"
          >
            <Sparkles className="w-4.5 h-4.5" />
            Brewtra Rewards
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-4"
          >
            Ưu Đãi Đặc Quyền
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-300 text-sm md:text-base max-w-xl mx-auto leading-relaxed"
          >
            Thưởng thức hương vị cà phê tuyệt hảo với loạt mã giảm giá, Freeship và đặc quyền dành riêng cho khách hàng của Brewtra.
          </motion.p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto px-6 -mt-12 relative z-20">
        {/* Filter Toolbar */}
        <div className="bg-white rounded-3xl p-4 shadow-md border border-gray-100 flex flex-wrap gap-2 items-center justify-between mb-8">
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setFilterType('ALL')}
              className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${filterType === 'ALL'
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilterType('PERCENTAGE')}
              className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${filterType === 'PERCENTAGE'
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
            >
              Giảm phần trăm (%)
            </button>
            <button
              onClick={() => setFilterType('FIXED_AMOUNT')}
              className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${filterType === 'FIXED_AMOUNT'
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
            >
              Giảm tiền mặt (đ)
            </button>
          </div>

          <button
            onClick={fetchVouchers}
            disabled={loading}
            className="w-full sm:w-auto mt-2 sm:mt-0 p-2.5 text-gray-400 hover:text-primary transition-all flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
            Làm mới
          </button>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 text-sm font-bold animate-pulse">Đang nạp ưu đãi...</p>
          </div>
        ) : vouchers.length === 0 ? (
          /* Empty Vouchers State */
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[30vh]">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <Ticket className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-black text-gray-800 mb-2">Hiện chưa có ưu đãi nào</h3>
            <p className="text-gray-400 text-sm max-w-sm mb-6">Các chương trình đặc quyền đang được thiết lập và sẽ sớm xuất hiện tại đây.</p>
            <Link href="/menu" className="bg-primary text-white px-8 py-3.5 rounded-full font-bold shadow-lg shadow-primary/30 hover:bg-coffee-dark transition-all">
              Đến Thực Đơn
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Active Vouchers Section */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1.5 h-6 bg-primary rounded-full"></div>
                <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Voucher Đang Diễn Ra ({activeVouchers.length})</h2>
              </div>

              {activeVouchers.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center text-gray-400 text-sm font-medium border border-dashed border-gray-200">
                  Không tìm thấy voucher đang áp dụng phù hợp với bộ lọc của bạn.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeVouchers.map((v) => {
                    const isCopied = copiedCode === v.code;
                    const isEligible = subTotal >= v.minOrderAmount;
                    const remainingUsage = v.maxUsageCount - v.currentUsageCount;
                    const progress = (v.currentUsageCount / v.maxUsageCount) * 100;

                    return (
                      <motion.div
                        key={v.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ y: -4 }}
                        transition={{ duration: 0.3 }}
                        className="relative bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex min-h-[160px] group"
                      >
                        {/* Physical Ticket Side half-circles cut */}
                        <div className="absolute top-1/2 -left-3 -translate-y-1/2 w-6 h-6 bg-[#fcf9f2] rounded-full border border-gray-100/50 z-10"></div>
                        <div className="absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 bg-[#fcf9f2] rounded-full border border-gray-100/50 z-10"></div>

                        {/* Left Coupon Ticket Band */}
                        <div className="w-[32%] shrink-0 bg-gradient-to-br from-primary to-[#c48d2a] text-white flex flex-col items-center justify-center p-3 relative border-r-2 border-dashed border-white/20 select-none">
                          <Ticket className="w-8 h-8 opacity-20 absolute -top-1 -left-1" />
                          <Ticket className="w-8 h-8 opacity-20 absolute -bottom-1 -right-1" />

                          <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">GIẢM</p>
                          <span className="text-2xl md:text-3xl font-black tracking-tight leading-none">
                            {v.discountType === 'PERCENTAGE' ? `${v.discountValue}%` : `${(v.discountValue / 1000).toLocaleString()}k`}
                          </span>

                          {v.discountType === 'PERCENTAGE' && v.maxDiscountAmount && (
                            <p className="text-[8px] font-bold text-white/90 mt-2 text-center">Tối đa {(v.maxDiscountAmount / 1000).toLocaleString()}k</p>
                          )}
                        </div>

                        {/* Right Details Section */}
                        <div className="flex-1 p-5 pl-6 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start gap-2 mb-1">
                              <h3 className="font-extrabold text-base text-gray-800 leading-snug line-clamp-1">{v.name}</h3>

                              {/* Quick apply status badge */}
                              {subTotal > 0 && (
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 tracking-widest ${isEligible ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'
                                  }`}>
                                  {isEligible ? 'Đủ ĐK' : 'Chưa ĐK'}
                                </span>
                              )}
                            </div>

                            <p className="text-[10px] text-gray-400 font-bold mb-3 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-gray-400" />
                              Hạn dùng: {v.validUntil ? new Date(v.validUntil).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                            </p>

                            {/* Conditions text */}
                            <div className="text-[10px] text-gray-500 leading-relaxed mb-4 space-y-0.5">
                              <p>• Đơn tối thiểu: <strong>{v.minOrderAmount.toLocaleString()}đ</strong></p>
                              {v.discountType === 'PERCENTAGE' && v.maxDiscountAmount && (
                                <p>• Giảm tối đa: <strong>{v.maxDiscountAmount.toLocaleString()}đ</strong></p>
                              )}
                            </div>
                          </div>

                          {/* Progress bar and Action block */}
                          <div className="border-t border-gray-50 pt-3">
                            {/* Utilization Progress Bar */}
                            <div className="mb-3">
                              <div className="flex justify-between text-[8px] text-gray-400 font-bold mb-1">
                                <span>Đã dùng {progress.toFixed(0)}%</span>
                                <span>Còn {remainingUsage} lượt</span>
                              </div>
                              <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: `${progress}%` }}></div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Code display with dash borders */}
                              <div className="flex-1 bg-gray-50 border border-dashed border-gray-200 px-3 py-1.5 rounded-xl flex items-center justify-between">
                                <span className="font-black text-xs text-gray-800 tracking-wider uppercase select-all">{v.code}</span>
                                <button
                                  onClick={() => handleCopy(v.code)}
                                  className="text-gray-400 hover:text-primary transition-colors cursor-pointer"
                                  title="Sao chép mã"
                                >
                                  {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                </button>
                              </div>

                              {/* Quick apply to cart if subTotal meets condition */}
                              {subTotal > 0 && isEligible && (
                                <button
                                  onClick={() => handleApplyQuickly(v.code)}
                                  className="bg-primary text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-coffee-dark transition-all flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer shrink-0"
                                >
                                  Áp dụng
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Expired / Inactive Vouchers Section */}
            {expiredVouchers.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-1.5 h-6 bg-gray-300 rounded-full"></div>
                  <h2 className="text-xl font-black text-gray-400 uppercase tracking-tight">Hết Lượt / Hết Hạn ({expiredVouchers.length})</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-60 grayscale select-none">
                  {expiredVouchers.map((v) => {
                    return (
                      <div
                        key={v.id}
                        className="relative bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex min-h-[160px]"
                      >
                        {/* Physical Ticket Side half-circles cut */}
                        <div className="absolute top-1/2 -left-3 -translate-y-1/2 w-6 h-6 bg-[#fcf9f2] rounded-full border border-gray-100/50 z-10"></div>
                        <div className="absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 bg-[#fcf9f2] rounded-full border border-gray-100/50 z-10"></div>

                        {/* Left Coupon Ticket Band */}
                        <div className="w-[32%] shrink-0 bg-gray-400 text-white flex flex-col items-center justify-center p-3 relative border-r-2 border-dashed border-white/20">
                          <p className="text-[10px] font-black uppercase tracking-widest mb-1">GIẢM</p>
                          <span className="text-2xl font-black tracking-tight leading-none">
                            {v.discountType === 'PERCENTAGE' ? `${v.discountValue}%` : `${(v.discountValue / 1000).toLocaleString()}k`}
                          </span>
                        </div>

                        {/* Right Details Section */}
                        <div className="flex-1 p-5 pl-6 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start gap-2 mb-1">
                              <h3 className="font-extrabold text-base text-gray-500 leading-snug line-clamp-1">{v.name}</h3>
                              <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 tracking-widest bg-gray-100 text-gray-400">
                                Kết thúc
                              </span>
                            </div>

                            <p className="text-[10px] text-gray-400 font-bold mb-3 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              Hạn dùng: {v.validUntil ? new Date(v.validUntil).toLocaleDateString('vi-VN') : 'Đã kết thúc'}
                            </p>

                            <div className="text-[10px] text-gray-400 leading-relaxed mb-4">
                              <p>• Đơn tối thiểu: {v.minOrderAmount.toLocaleString()}đ</p>
                            </div>
                          </div>

                          <div className="border-t border-gray-50 pt-3">
                            <div className="bg-gray-50 border border-dashed border-gray-200 px-3 py-1.5 rounded-xl flex items-center justify-between">
                              <span className="font-black text-xs text-gray-400 tracking-wider uppercase">{v.code}</span>
                              <span className="text-[10px] font-bold text-gray-400">Không khả dụng</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
