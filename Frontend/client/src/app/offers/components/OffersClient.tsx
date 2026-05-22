"use client";

import { useEffect, useState } from "react";
import { Ticket, Copy, Check, Sparkles, Clock, ArrowRight, ShieldCheck, RefreshCw, ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { voucherService } from "@/services/voucher.service";
import type { Voucher } from "@/services/voucher.service";
import { useCartStore } from "@/store/zustand/useCartStore";
import { useAuthStore } from "@/store/zustand/useAuthStore";
import toast from "react-hot-toast";
import Link from "next/link";
import Image from "next/image";

export default function OffersClient({ initialVouchers = [] }: { initialVouchers?: Voucher[] }) {
  const { user } = useAuthStore();
  const { items: cartItems } = useCartStore();
  const [vouchers, setVouchers] = useState<Voucher[]>(initialVouchers);
  const [loading, setLoading] = useState(initialVouchers.length === 0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'PERCENTAGE' | 'FIXED_AMOUNT'>('ALL');

  // Tính tạm tính giỏ hàng hiện tại để xem voucher nào đủ điều kiện áp dụng luôn
  const subTotal = cartItems.reduce((total, item) => total + (item.unitPrice * item.quantity), 0);

  const checkVoucherTierEligibility = (voucher: Voucher) => {
    const tier = voucher.applicableTier || 'ALL';
    if (tier === 'ALL') return { eligible: true };
    if (!user) return { eligible: false, reason: 'LOGIN_REQUIRED', message: 'Yêu cầu đăng nhập' };
    
    const userTier = (user.tier || 'MEMBER').toUpperCase();
    if (tier === 'VIP' && userTier !== 'VIP') {
      return { eligible: false, reason: 'VIP_REQUIRED', message: 'Dành cho VIP' };
    }
    return { eligible: true };
  };

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const res = await voucherService.getVouchers();
      if (res.success && res.data) {
        // Lọc hiển thị các voucher đang kích hoạt
        setVouchers(res.data);
      } else {
        setVouchers([]);
      }
    } catch (err: any) {
      console.warn("Không thể lấy danh sách voucher từ máy chủ:", err?.message || err);
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, [user]);

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
    const tier = v.applicableTier || 'ALL';

    // Nếu là khách vãng lai (chưa đăng nhập), ẩn hoàn toàn voucher của MEMBER và VIP
    if (!user) {
      if (tier !== 'ALL') return false;
    } else {
      // Đã đăng nhập: lấy hạng thành viên của user
      const userTier = (user.tier || 'MEMBER').toUpperCase();
      // Nếu là tài khoản MEMBER, ẩn hoàn toàn voucher VIP
      if (userTier === 'MEMBER' && tier === 'VIP') {
        return false;
      }
    }

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
          /* Empty Vouchers / Guest State */
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[30vh]">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <Ticket className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-black text-gray-800 mb-2">
              {!user ? "Đăng nhập để xem ưu đãi đặc quyền" : "Hiện chưa có ưu đãi nào"}
            </h3>
            <p className="text-gray-400 text-sm max-w-md mb-6 leading-relaxed">
              {!user 
                ? "Vui lòng đăng nhập tài khoản của bạn để xem danh sách các mã giảm giá và chương trình quà tặng đặc sắc dành riêng cho thành viên Brewtra."
                : "Các chương trình khuyến mãi và quà tặng đang được chuẩn bị và sẽ sớm được hiển thị tại đây."}
            </p>
            {!user ? (
              <Link href="/login" className="bg-primary text-white px-8 py-3.5 rounded-full font-bold shadow-lg shadow-primary/30 hover:bg-coffee-dark transition-all">
                Đăng Nhập Ngay
              </Link>
            ) : (
              <Link href="/menu" className="bg-primary text-white px-8 py-3.5 rounded-full font-bold shadow-lg shadow-primary/30 hover:bg-coffee-dark transition-all">
                Đến Thực Đơn
              </Link>
            )}
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
                    const tierEligibility = checkVoucherTierEligibility(v);

                    return (
                      <motion.div
                        key={v.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={tierEligibility.eligible ? { y: -3 } : {}}
                        transition={{ duration: 0.25 }}
                        className={`relative bg-white rounded-2xl shadow-sm border overflow-hidden flex min-h-[165px] group transition-all ${
                          !tierEligibility.eligible 
                            ? 'border-gray-200/80 bg-gray-50/30 opacity-75' 
                            : v.applicableTier === 'VIP'
                              ? 'border-amber-200 hover:border-amber-300 hover:shadow-md hover:shadow-amber-50'
                              : v.applicableTier === 'MEMBER'
                                ? 'border-[#E5DEC9] hover:border-primary/45 hover:shadow-md hover:shadow-primary/5'
                                : 'border-gray-100 hover:border-primary/30 hover:shadow-md'
                        }`}
                      >
                        {/* Ticket cut-outs at the divider point */}
                        <div className={`absolute -top-2 left-[28%] -translate-x-1/2 w-4 h-4 bg-[#fcf9f2] rounded-full border z-10 ${
                          v.applicableTier === 'VIP'
                            ? 'border-amber-200'
                            : v.applicableTier === 'MEMBER'
                              ? 'border-[#E5DEC9]'
                              : 'border-gray-200'
                        }`}></div>
                        <div className={`absolute -bottom-2 left-[28%] -translate-x-1/2 w-4 h-4 bg-[#fcf9f2] rounded-full border z-10 ${
                          v.applicableTier === 'VIP'
                            ? 'border-amber-200'
                            : v.applicableTier === 'MEMBER'
                              ? 'border-[#E5DEC9]'
                              : 'border-gray-200'
                        }`}></div>
                        
                        {/* Vertical dotted divider line */}
                        <div className="absolute top-0 bottom-0 left-[28%] border-l border-dashed border-gray-200 z-0"></div>

                        {/* Left Coupon Section - Keeping solid coffee-branded gradients */}
                        <div className={`w-[28%] shrink-0 flex flex-col items-center justify-center p-3 relative select-none text-white ${
                          v.applicableTier === 'VIP'
                            ? 'bg-gradient-to-br from-[#c8a97e] to-[#8c6b3f]'
                            : v.applicableTier === 'MEMBER'
                              ? 'bg-gradient-to-br from-[#8C5E3C] to-[#5C3E26]'
                              : 'bg-gradient-to-br from-primary to-coffee-dark'
                        }`}>
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/80 mb-1">
                            {!tierEligibility.eligible ? 'ĐẶC QUYỀN' : 'GIẢM'}
                          </p>
                          <span className="text-3.5xl md:text-4xl font-extrabold tracking-tight text-white leading-none">
                            {v.discountType === 'PERCENTAGE' ? `${v.discountValue}%` : `${(v.discountValue / 1000).toLocaleString('vi-VN')}k`}
                          </span>

                          {v.discountType === 'PERCENTAGE' && v.maxDiscountAmount && (
                            <p className="text-[9px] font-bold text-white/90 mt-2 text-center">Tối đa {(v.maxDiscountAmount / 1000).toLocaleString('vi-VN')}k</p>
                          )}
                        </div>

                        {/* Right Details Section */}
                        <div className="flex-1 p-5 pl-6 flex flex-col justify-between bg-white z-10">
                          <div>
                            {/* Top Badge Line */}
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-gray-450" />
                                <span className="text-xs text-gray-500 font-bold">
                                  Hạn dùng: {v.validUntil ? new Date(v.validUntil).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                                </span>
                              </div>
                              <div className="flex gap-1 items-center">
                                {v.applicableTier && v.applicableTier !== 'ALL' && (
                                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider border ${
                                    v.applicableTier === 'VIP' 
                                      ? 'bg-gradient-to-r from-amber-50 to-amber-100/50 text-amber-700 border-amber-200/60 shadow-sm' 
                                      : 'bg-[#FAF8F5] text-primary border-primary/20'
                                  }`}>
                                    {v.applicableTier === 'VIP' ? '★ VIP' : '● MEMBER'}
                                  </span>
                                )}
                                {subTotal > 0 && (
                                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider border ${
                                    isEligible 
                                      ? 'bg-green-50 text-green-700 border-green-200' 
                                      : 'bg-red-50 text-red-500 border-red-200'
                                  }`}>
                                    {isEligible ? 'Đủ ĐK' : 'Chưa ĐK'}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Title */}
                            <h3 className="font-extrabold text-base md:text-lg text-gray-800 leading-snug mb-1 line-clamp-1">
                              {v.name}
                            </h3>

                            {/* Conditions line */}
                            <p className="text-xs text-gray-500 font-bold mb-3.5 flex flex-wrap items-center gap-1.5">
                              <span className="text-[#a87c53] font-extrabold">Đơn từ {v.minOrderAmount.toLocaleString('vi-VN')}đ</span>
                              {v.discountType === 'PERCENTAGE' && v.maxDiscountAmount && (
                                <>
                                  <span className="text-gray-300">•</span>
                                  <span>Tối đa {v.maxDiscountAmount.toLocaleString('vi-VN')}đ</span>
                                </>
                              )}
                              <span className="text-gray-300">•</span>
                              <span>
                                {v.applicableTier === 'VIP' 
                                  ? 'Chỉ VIP' 
                                  : v.applicableTier === 'MEMBER' 
                                    ? 'Thành viên' 
                                    : 'Tất cả'}
                              </span>
                            </p>
                          </div>

                          {/* Progress bar and Action block */}
                          <div className="border-t border-gray-50 pt-3.5">
                            {/* Utilization Progress Bar */}
                            <div className="mb-3.5">
                              <div className="flex justify-between text-[10px] text-gray-400 font-bold mb-1">
                                <span>Đã dùng {progress.toFixed(0)}%</span>
                                <span>Còn {remainingUsage} lượt</span>
                              </div>
                              <div className="w-full h-1 bg-gray-50 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-primary to-[#d37533] rounded-full" style={{ width: `${progress}%` }}></div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {tierEligibility.eligible ? (
                                <>
                                  {/* Code button with copy action */}
                                  <button
                                    onClick={() => handleCopy(v.code)}
                                    className={`flex-1 flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-dashed text-left transition-all cursor-pointer group/code ${
                                      isCopied 
                                        ? 'border-green-500 bg-green-50/20' 
                                        : 'border-primary/20 bg-[#FAF8F5] hover:bg-[#F4E9DA]/40 hover:border-primary/45'
                                    }`}
                                  >
                                    <span className="font-extrabold text-sm text-gray-800 tracking-wider uppercase select-all">{v.code}</span>
                                    <span className="shrink-0 ml-2">
                                      {isCopied ? (
                                        <span className="text-green-600 text-[11px] font-extrabold flex items-center gap-0.5 animate-pulse">
                                          <Check className="w-4 h-4" /> Đã chép
                                        </span>
                                      ) : (
                                        <Copy className="w-4 h-4 text-primary/70 group-hover/code:text-primary transition-colors" />
                                      )}
                                    </span>
                                  </button>

                                  {/* Quick apply to cart if subTotal meets condition */}
                                  {subTotal > 0 && isEligible && (
                                    <button
                                      onClick={() => handleApplyQuickly(v.code)}
                                      className="bg-primary hover:bg-coffee-dark text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer shrink-0"
                                    >
                                      Áp dụng
                                      <ArrowRight className="w-4 h-4" />
                                    </button>
                                  )}
                                </>
                              ) : tierEligibility.reason === 'LOGIN_REQUIRED' ? (
                                <Link
                                  href="/login"
                                  className="w-full bg-[#f3ede4] hover:bg-[#eadecc] text-primary py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer font-bold"
                                >
                                  <span>Đăng nhập để nhận</span>
                                  <ArrowRight className="w-4 h-4" />
                                </Link>
                              ) : (
                                <div className="w-full bg-gray-50 text-gray-400 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-center flex items-center justify-center gap-1.5 select-none border border-gray-100 font-bold">
                                  <span>Chỉ dành cho VIP</span>
                                </div>
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
          </div>
        )}
      </div>
    </div>
  );
}
