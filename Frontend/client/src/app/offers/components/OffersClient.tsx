"use client";

import { useEffect, useState } from "react";
import { Ticket, Copy, Check, Sparkles, Clock, ArrowRight, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { voucherService } from "@/services/voucher.service";
import type { Voucher } from "@/services/voucher.service";
import { useCartStore } from "@/store/zustand/useCartStore";
import { useAuthStore } from "@/store/zustand/useAuthStore";
import toast from "react-hot-toast";
import Link from "next/link";

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

  // Lọc voucher theo hạng thành viên
  const filteredVouchers = vouchers.filter(v => {
    const tier = v.applicableTier || 'ALL';
    if (!user) {
      if (tier !== 'ALL') return false;
    } else {
      const userTier = (user.tier || 'MEMBER').toUpperCase();
      if (userTier === 'MEMBER' && tier === 'VIP') {
        return false;
      }
    }
    if (filterType === 'ALL') return true;
    return v.discountType === filterType;
  });

  // Tách voucher còn hiệu lực
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
    <div className="min-h-screen bg-secondary/30 pb-24 md:pb-32">
      {/* Hero Banner Section */}
      <div className="relative bg-gradient-to-br from-coffee-dark to-black text-white pt-16 pb-24 md:pt-20 md:pb-28 px-4 sm:px-6 overflow-hidden rounded-b-[32px] md:rounded-b-[50px] shadow-xl">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="absolute -top-10 -right-10 w-48 h-48 md:w-60 md:h-60 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-48 h-48 md:w-60 md:h-60 bg-primary/10 rounded-full blur-3xl"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-primary/20 text-primary border border-primary/30 px-3.5 py-1.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest mb-4 md:mb-6"
          >
            <Sparkles className="w-3.5 h-3.5 md:w-4.5 md:h-4.5" />
            Brewtra Rewards
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-2xl sm:text-3xl md:text-5xl font-black uppercase tracking-tight mb-3 md:mb-4 px-2"
          >
            Ưu Đãi Đặc Quyền
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-350 text-xs md:text-base max-w-xl mx-auto leading-relaxed px-4"
          >
            Thưởng thức hương vị cà phê tuyệt hảo với loạt mã giảm giá, Freeship và đặc quyền dành riêng cho khách hàng của Brewtra.
          </motion.p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-10 md:mt-12 relative z-20">

        {/* Filter Toolbar */}
        <div className="bg-white rounded-2xl md:rounded-3xl p-3 md:p-4 shadow-md border border-gray-100 flex flex-col sm:flex-row gap-3 items-center justify-between mb-6 md:mb-8">
          <div className="flex flex-wrap gap-1.5 md:gap-2 w-full sm:w-auto">
            <button
              onClick={() => setFilterType('ALL')}
              className={`flex-1 sm:flex-none px-3 md:px-5 py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-wider transition-all ${filterType === 'ALL' ? 'bg-primary text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilterType('PERCENTAGE')}
              className={`flex-1 sm:flex-none px-3 md:px-5 py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-wider transition-all ${filterType === 'PERCENTAGE' ? 'bg-primary text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
            >
              Giảm %
            </button>
            <button
              onClick={() => setFilterType('FIXED_AMOUNT')}
              className={`flex-1 sm:flex-none px-3 md:px-5 py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-wider transition-all ${filterType === 'FIXED_AMOUNT' ? 'bg-primary text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
            >
              Giảm tiền (đ)
            </button>
          </div>

          <button
            onClick={fetchVouchers}
            disabled={loading}
            className="w-full sm:w-auto p-2 text-gray-400 hover:text-primary transition-all flex items-center justify-center gap-2 text-[11px] md:text-xs font-black uppercase tracking-wider border-t border-gray-100 sm:border-none pt-2 sm:pt-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-primary' : ''}`} />
            Làm mới
          </button>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 md:py-20">
            <div className="w-10 h-10 md:w-12 md:h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 text-xs md:text-sm font-bold animate-pulse">Đang nạp ưu đãi...</p>
          </div>
        ) : vouchers.length === 0 ? (
          /* Empty/Guest State */
          <div className="bg-white rounded-2xl md:rounded-3xl p-8 md:p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[30vh]">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 md:mb-6">
              <Ticket className="w-8 h-8 md:w-10 md:h-10 text-gray-300" />
            </div>
            <h3 className="text-lg md:text-xl font-black text-gray-800 mb-2">
              {!user ? "Đăng nhập để xem ưu đãi đặc quyền" : "Hiện chưa có ưu đãi nào"}
            </h3>
            <p className="text-gray-400 text-xs md:text-sm max-w-md mb-6 leading-relaxed px-2">
              {!user
                ? "Vui lòng đăng nhập tài khoản của bạn để xem danh sách các mã giảm giá và chương trình quà tặng đặc sắc dành riêng cho thành viên Brewtra."
                : "Các chương trình khuyến mãi và quà tặng đang được chuẩn bị và sẽ sớm được hiển thị tại đây."}
            </p>
            {!user ? (
              <Link href="/login" className="bg-primary text-white px-6 md:px-8 py-3 rounded-full text-xs md:text-sm font-bold shadow-lg shadow-primary/30 hover:bg-coffee-dark transition-all">
                Đăng Nhập Ngay
              </Link>
            ) : (
              <Link href="/menu" className="bg-primary text-white px-6 md:px-8 py-3 rounded-full text-xs md:text-sm font-bold shadow-lg shadow-primary/30 hover:bg-coffee-dark transition-all">
                Đến Thực Đơn
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-6 md:space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-4 md:mb-6">
                <div className="w-1 h-5 md:w-1.5 md:h-6 bg-primary rounded-full"></div>
                <h2 className="text-base md:text-xl font-black text-gray-800 uppercase tracking-tight">Voucher Đang Diễn Ra ({activeVouchers.length})</h2>
              </div>

              {activeVouchers.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 md:p-8 text-center text-gray-400 text-xs md:text-sm border border-dashed border-gray-200">
                  Không tìm thấy voucher phù hợp với bộ lọc.
                </div>
              ) : (
                // Responsive Grid: 1 cột ở mobile, 2 cột ở máy tính bảng/PC trở lên
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {activeVouchers.map((v) => {
                    const isCopied = copiedCode === v.code;
                    const isEligible = subTotal >= v.minOrderAmount;
                    const remainingUsage = v.maxUsageCount - v.currentUsageCount;
                    const progress = (v.currentUsageCount / v.maxUsageCount) * 100;
                    const tierEligibility = checkVoucherTierEligibility(v);

                    return (
                      <motion.div
                        key={v.id}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={tierEligibility.eligible ? { y: -2 } : {}}
                        transition={{ duration: 0.2 }}
                        className={`relative bg-white rounded-xl md:rounded-2xl shadow-sm border overflow-hidden flex min-h-[145px] sm:min-h-[160px] group transition-all ${!tierEligibility.eligible
                          ? 'border-gray-200 bg-gray-50/50 opacity-70'
                          : v.applicableTier === 'VIP'
                            ? 'border-amber-200 hover:border-amber-300 shadow-sm shadow-amber-50/30'
                            : v.applicableTier === 'MEMBER'
                              ? 'border-primary/20 hover:border-primary/40'
                              : 'border-gray-100 hover:border-primary/20'
                          }`}
                      >
                        {/* Định vị lại vị trí đục lỗ vé chuẩn theo chiều ngang (Sử dụng 90px cố định thay vì %) */}
                        <div className={`absolute -top-2 left-[85px] sm:left-[105px] -translate-x-1/2 w-3.5 h-3.5 bg-secondary/30 rounded-full border z-10 ${v.applicableTier === 'VIP' ? 'border-amber-200' : v.applicableTier === 'MEMBER' ? 'border-primary/20' : 'border-gray-200'
                          }`}></div>
                        <div className={`absolute -bottom-2 left-[85px] sm:left-[105px] -translate-x-1/2 w-3.5 h-3.5 bg-secondary/30 rounded-full border z-10 ${v.applicableTier === 'VIP' ? 'border-amber-200' : v.applicableTier === 'MEMBER' ? 'border-primary/20' : 'border-gray-200'
                          }`}></div>

                        {/* Đường kẻ đứt phân đoạn cuống vé */}
                        <div className="absolute top-0 bottom-0 left-[85px] sm:left-[105px] border-l border-dashed border-gray-100 z-0"></div>

                        {/* CỘT TRÁI (Cuống vé): Tách cứng chiều rộng bằng pixel tĩnh để chữ số không bị bóp nghẹt */}
                        <div className={`w-[85px] sm:w-[105px] shrink-0 flex flex-col items-center justify-center p-2 relative select-none text-white ${v.applicableTier === 'VIP'
                          ? 'bg-gradient-to-br from-[#c8a97e] to-[#8c6b3f]'
                          : v.applicableTier === 'MEMBER'
                            ? 'bg-gradient-to-br from-primary to-accent'
                            : 'bg-gradient-to-br from-primary to-coffee-dark'
                          }`}>
                          <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-white/80 mb-0.5 sm:mb-1">
                            {!tierEligibility.eligible ? 'ĐẶC QUYỀN' : 'GIẢM'}
                          </p>

                          {/* Co giãn cỡ chữ linh động dựa trên độ dài chuỗi giá trị giảm giá */}
                          <span className={`font-black tracking-tighter text-white leading-none text-center ${v.discountType === 'PERCENTAGE'
                            ? 'text-2xl sm:text-3xl'
                            : v.discountValue >= 100000 ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'
                            }`}>
                            {v.discountType === 'PERCENTAGE' ? `${v.discountValue}%` : `${(v.discountValue / 1000).toLocaleString('vi-VN')}k`}
                          </span>

                          {v.discountType === 'PERCENTAGE' && v.maxDiscountAmount && (
                            <p className="text-[8px] font-bold text-white/90 mt-1.5 text-center truncate max-w-[75px]">
                              Tối đa {(v.maxDiscountAmount / 1000).toLocaleString('vi-VN')}k
                            </p>
                          )}
                        </div>

                        {/* CỘT PHẢI: Nội dung chi tiết */}
                        <div className="flex-1 p-3.5 sm:p-4 pl-4 sm:pl-5 flex flex-col justify-between bg-white z-10 overflow-hidden">
                          <div>
                            {/* Khối huy hiệu đầu thẻ */}
                            <div className="flex items-center justify-between gap-1 mb-1.5">
                              <div className="flex items-center gap-1 min-w-0">
                                <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                                <span className="text-[10px] text-gray-400 font-bold truncate">
                                  Hạn: {v.validUntil ? new Date(v.validUntil).toLocaleDateString('vi-VN') : 'Vô hạn'}
                                </span>
                              </div>
                              <div className="flex gap-1 items-center shrink-0">
                                {v.applicableTier && v.applicableTier !== 'ALL' && (
                                  <span className={`text-[8px] sm:text-[9px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider border ${v.applicableTier === 'VIP'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-[#FAF8F5] text-primary border-primary/20'
                                    }`}>
                                    {v.applicableTier === 'VIP' ? '★ VIP' : '● MEM'}
                                  </span>
                                )}
                                {subTotal > 0 && (
                                  <span className={`text-[8px] sm:text-[9px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider border ${isEligible ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-500 border-red-200'
                                    }`}>
                                    {isEligible ? 'Đủ ĐK' : 'Thiếu đk'}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Tiêu đề Voucher */}
                            <h3 className="font-extrabold text-sm sm:text-base text-gray-800 leading-tight mb-1 truncate">
                              {v.name}
                            </h3>

                            {/* Điều kiện áp dụng */}
                            <p className="text-[11px] text-gray-500 font-bold mb-2 flex flex-wrap items-center gap-1">
                              <span className="text-primary font-extrabold">Đơn từ {v.minOrderAmount.toLocaleString('vi-VN')}đ</span>
                              {v.discountType === 'PERCENTAGE' && v.maxDiscountAmount && (
                                <>
                                  <span className="text-gray-300">•</span>
                                  <span className="truncate">Tối đa {v.maxDiscountAmount.toLocaleString('vi-VN')}đ</span>
                                </>
                              )}
                            </p>
                          </div>

                          {/* Khối thanh tiến độ & Nút tương tác bottom */}
                          <div className="border-t border-gray-50 pt-2">
                            {/* Thanh phần trăm sử dụng */}
                            <div className="mb-2">
                              <div className="flex justify-between text-[9px] text-gray-400 font-bold mb-0.5">
                                <span>Đã dùng {progress.toFixed(0)}%</span>
                                <span>Còn {remainingUsage} lượt</span>
                              </div>
                              <div className="w-full h-1 bg-gray-50 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-primary to-[#d37533] rounded-full" style={{ width: `${progress}%` }}></div>
                              </div>
                            </div>

                            {/* Cụm nút bấm hành động */}
                            <div className="flex items-center gap-1.5">
                              {tierEligibility.eligible ? (
                                <>
                                  {/* Ô mã code kèm tính năng click-to-copy */}
                                  <button
                                    onClick={() => handleCopy(v.code)}
                                    className={`flex-1 flex items-center justify-between px-2.5 py-1.5 md:py-2 rounded-lg border border-dashed text-left transition-all cursor-pointer group/code min-w-0 ${isCopied ? 'border-green-500 bg-green-50/20' : 'border-primary/20 bg-[#FAF8F5]'
                                      }`}
                                  >
                                    <span className="font-extrabold text-xs text-gray-800 tracking-wider uppercase select-all truncate mr-1">{v.code}</span>
                                    <span className="shrink-0">
                                      {isCopied ? (
                                        <span className="text-green-600 text-[10px] font-extrabold flex items-center gap-0.5">
                                          <Check className="w-3 h-3" /> Chép xong
                                        </span>
                                      ) : (
                                        <Copy className="w-3 h-3 text-primary/70 group-hover/code:text-primary" />
                                      )}
                                    </span>
                                  </button>

                                  {/* Nút áp dụng nhanh (Chỉ hiện khi giỏ hàng có đồ và đủ điều kiện tối thiểu) */}
                                  {subTotal > 0 && isEligible && (
                                    <button
                                      onClick={() => handleApplyQuickly(v.code)}
                                      className="bg-primary hover:bg-coffee-dark text-white px-3 py-1.5 md:py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-0.5 shadow-sm active:scale-95 shrink-0"
                                    >
                                      Dùng
                                      <ArrowRight className="w-3 h-3" />
                                    </button>
                                  )}
                                </>
                              ) : tierEligibility.reason === 'LOGIN_REQUIRED' ? (
                                <Link
                                  href="/login"
                                  className="w-full bg-primary/10 hover:bg-primary/20 text-primary py-1.5 md:py-2 rounded-lg text-[11px] font-black uppercase tracking-wider text-center transition-all flex items-center justify-center gap-1"
                                >
                                  <span>Đăng nhập để nhận</span>
                                  <ArrowRight className="w-3 h-3" />
                                </Link>
                              ) : (
                                <div className="w-full bg-gray-50 text-gray-400 py-1.5 md:py-2 rounded-lg text-[11px] font-black uppercase tracking-wider text-center flex items-center justify-center border border-gray-100 select-none">
                                  <span>Chỉ dành cho hội viên VIP</span>
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