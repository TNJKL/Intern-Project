"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, MapPin, CreditCard, CheckCircle2, Truck, Ticket } from "lucide-react";
import { motion } from "framer-motion";
import { useCartStore } from "@/store/zustand/useCartStore";
import { useAuthStore } from "@/store/zustand/useAuthStore";
import { orderService } from "@/services/order.service";
import { voucherService } from "@/services/voucher.service";
import type { Voucher, ValidateVoucherResult } from "@/services/voucher.service";
import toast from "react-hot-toast";
import { useSocket } from "@/components/providers/SocketProvider";

export default function CheckoutClient() {
  const { items: cartItems, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const { joinGuestRoom } = useSocket();
  const [mounted, setMounted] = useState(false);
  
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdOrderCode, setCreatedOrderCode] = useState("");

  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<ValidateVoucherResult | null>(null);
  const [voucherInput, setVoucherInput] = useState("");

  const subTotal = cartItems.reduce((total, item) => total + (item.unitPrice * item.quantity), 0);
  const shippingFee = 15000;

  // Chỉ dùng cho khách vãng lai (guest)
  const isGuest = !user;

  useEffect(() => {
    setMounted(true);
    const fetchVouchers = async () => {
      try {
        const res = await voucherService.getVouchers();
        if (res.success && res.data) {
          // Lọc voucher theo hạng người dùng:
          // - Vãng lai chỉ thấy ALL
          // - MEMBER chỉ thấy ALL và MEMBER
          // - VIP thấy tất cả
          const filteredData = res.data.filter(v => {
            const tier = v.applicableTier || 'ALL';
            if (!user) {
              if (tier !== 'ALL') return false;
            } else {
              const userTier = (user.tier || 'MEMBER').toUpperCase();
              if (userTier === 'MEMBER' && tier === 'VIP') return false;
            }
            return true;
          });

          const now = new Date();
          const validVouchers = filteredData.filter(v => {
            const validFrom = new Date(v.validFrom);
            const validUntil = v.validUntil ? new Date(v.validUntil) : null;
            const hasStarted = now >= validFrom;
            const hasNotExpired = !validUntil || now <= validUntil;
            const hasUsageLeft = v.currentUsageCount < v.maxUsageCount;
            return v.isActive && hasStarted && hasNotExpired && hasUsageLeft;
          });
          setVouchers(validVouchers);
        } else {
          setVouchers([]);
        }
      } catch (err: any) {
        console.warn("Không thể tải danh sách voucher từ server:", err?.message || err);
        setVouchers([]);
      }
    };
    fetchVouchers();
  }, [user]);

  // Tự động quản lý voucher (khôi phục & cập nhật theo giỏ hàng ở checkout)
  const checkVoucherEligibility = (code: string): { eligible: boolean; message?: string } => {
    const voucherInfo = vouchers.find(v => v.code.toUpperCase() === code.toUpperCase());
    if (!voucherInfo) {
      return { eligible: true };
    }

    const tier = voucherInfo.applicableTier || 'ALL';
    if (tier === 'ALL') {
      return { eligible: true };
    }

    if (!user) {
      return { 
        eligible: false, 
        message: "Mã giảm giá này chỉ dành cho thành viên. Vui lòng đăng nhập!" 
      };
    }

    const userTier = (user.tier || 'MEMBER').toUpperCase();

    if (tier === 'VIP') {
      if (userTier !== 'VIP') {
        return { 
          eligible: false, 
          message: "Mã giảm giá này chỉ dành cho thành viên VIP!" 
        };
      }
    }

    return { eligible: true };
  };

  useEffect(() => {
    if (!mounted) return;

    const savedCode = localStorage.getItem('brewtra_applied_voucher');

    // TH1: Có mã lưu trong localStorage nhưng chưa nạp vào state, và giỏ hàng đã có sản phẩm
    if (savedCode && !selectedVoucher && subTotal > 0) {
      if (vouchers.length > 0) {
        const eligibility = checkVoucherEligibility(savedCode);
        if (!eligibility.eligible) {
          localStorage.removeItem('brewtra_applied_voucher');
          setSelectedVoucher(null);
          return;
        }
      }

      voucherService.validateVoucher(savedCode, subTotal)
        .then(validationRes => {
          if (validationRes.success && validationRes.data && validationRes.data.valid) {
            setSelectedVoucher(validationRes.data);
            setVoucherInput(validationRes.data.code);
          } else {
            localStorage.removeItem('brewtra_applied_voucher');
          }
        })
        .catch(() => {
          localStorage.removeItem('brewtra_applied_voucher');
        });
    }

    // TH2: Đã có voucher, tự động tính toán lại khi subTotal thay đổi
    if (selectedVoucher && subTotal > 0) {
      if (vouchers.length > 0) {
        const eligibility = checkVoucherEligibility(selectedVoucher.code);
        if (!eligibility.eligible) {
          localStorage.removeItem('brewtra_applied_voucher');
          setSelectedVoucher(null);
          return;
        }
      }

      voucherService.validateVoucher(selectedVoucher.code, subTotal)
        .then(validationRes => {
          if (validationRes.success && validationRes.data) {
            setSelectedVoucher(validationRes.data);
            if (!validationRes.data.valid) {
              localStorage.removeItem('brewtra_applied_voucher');
            } else {
              localStorage.setItem('brewtra_applied_voucher', validationRes.data.code);
            }
          }
        })
        .catch(() => {
          setSelectedVoucher(null);
          localStorage.removeItem('brewtra_applied_voucher');
        });
    }

    // TH3: Giỏ hàng trống
    if (selectedVoucher && subTotal === 0) {
      setSelectedVoucher(null);
      localStorage.removeItem('brewtra_applied_voucher');
    }
  }, [subTotal, mounted, vouchers]);

  const discount = selectedVoucher && selectedVoucher.valid ? (selectedVoucher.discountAmount || 0) : 0;
  
  const total = Math.max(0, subTotal + shippingFee - discount);

  const handleApplyVoucher = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!voucherInput.trim()) {
      toast.error("Vui lòng nhập mã voucher!");
      return;
    }
    const code = voucherInput.trim().toUpperCase();
    
    // Kiểm tra hạng thành viên trước khi gọi API
    const eligibility = checkVoucherEligibility(code);
    if (!eligibility.eligible) {
      toast.error(eligibility.message || "Bạn không đủ điều kiện sử dụng mã giảm giá này!");
      setSelectedVoucher(null);
      localStorage.removeItem('brewtra_applied_voucher');
      return;
    }

    try {
      const res = await voucherService.validateVoucher(code, subTotal);
      if (res.success && res.data) {
        const result = res.data;
        setSelectedVoucher(result);
        if (result.valid) {
          localStorage.setItem('brewtra_applied_voucher', result.code);
          toast.success(`Đã áp dụng mã ${result.code}!`);
        } else {
          toast.error(result.message || "Mã giảm giá không hợp lệ!");
          localStorage.removeItem('brewtra_applied_voucher');
        }
      } else {
        toast.error(res.message || "Mã giảm giá không hợp lệ!");
        setSelectedVoucher(null);
        localStorage.removeItem('brewtra_applied_voucher');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Mã giảm giá không hợp lệ hoặc đã hết hạn!");
      setSelectedVoucher(null);
      localStorage.removeItem('brewtra_applied_voucher');
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      toast.error("Giỏ hàng của bạn đang trống!");
      return;
    }

    setIsSubmitting(true);
    try {
      // User đã đăng nhập: gửi thông tin lấy từ object user (nhưng không gửi userId vì backend sẽ bắt lỗi DTO)
      // Khách vãng lai: gửi thông tin nhập từ form
      const u = user as any;
      const actualName = u?.fullName || u?.name || u?.userName || u?.user_name || "Thành viên";
      const actualEmail = u?.email || u?.userEmail || u?.user_email || "khachhang@thanhvien.com";
      const actualPhone = u?.phone || u?.userPhone || u?.user_phone || "0999999999";

      const payload = user
        ? {
            userName: actualName,
            userEmail: actualEmail,
            userPhone: actualPhone,
            deliveryAddress: address,
            paymentMethod: paymentMethod,
            note: note,
            items: cartItems.map(item => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              toppingIds: item.toppingIds,
            })),
            voucherCode: selectedVoucher ? selectedVoucher.code : undefined
          }
        : {
            userName: name,
            userEmail: email,
            userPhone: phone,
            deliveryAddress: address,
            paymentMethod: paymentMethod,
            note: note,
            items: cartItems.map(item => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              toppingIds: item.toppingIds,
            })),
            voucherCode: selectedVoucher ? selectedVoucher.code : undefined
          };
      
      const res = await orderService.createOrder(payload as any);
      if (res && res.success && res.data) {
        setCreatedOrderCode(res.data.orderCode);

        // ─── Guest: lưu guestSessionId để theo dõi đơn hàng realtime ───
        if (!user && res.data.guestSessionId) {
          const { guestSessionId, orderCode } = res.data;
          localStorage.setItem('brewtra_guest_session_id', guestSessionId);
          localStorage.setItem('brewtra_guest_order_code', orderCode);
          // Kết nối socket và join room ngay lập tức
          joinGuestRoom(guestSessionId);
        }
      }
      clearCart();
      localStorage.removeItem('brewtra_applied_voucher');
      setIsSuccess(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi đặt hàng.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return <div className="min-h-screen bg-[#fcf9f2]"></div>;

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#fcf9f2] flex flex-col items-center justify-center p-6 pb-32">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-8 md:p-12 rounded-[40px] shadow-xl text-center max-w-md w-full border border-gray-100"
        >
          <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black text-gray-800 mb-2 uppercase">Đặt hàng thành công!</h1>
          
          {createdOrderCode && (
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 my-6 text-center">
              <p className="text-xs text-gray-500 font-bold uppercase mb-1">Mã đơn hàng của bạn</p>
              <p className="text-xl font-black text-primary tracking-wider select-all">{createdOrderCode}</p>
              <p className="text-[10px] text-gray-400 mt-2">Vui lòng lưu lại mã này để tra cứu trạng thái đơn hàng của bạn.</p>
            </div>
          )}

          <p className="text-gray-500 mb-8 leading-relaxed">
            Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đang được xử lý và sẽ sớm giao những ly cà phê tuyệt hảo đến tay bạn.
          </p>
          
          <div className="space-y-3">
            {user ? (
              <Link href="/orders" className="block w-full bg-primary text-white py-4 rounded-2xl font-bold hover:bg-coffee-dark transition-colors">
                Theo dõi đơn hàng
              </Link>
            ) : (
              <Link href={`/orders/track?code=${createdOrderCode}&phone=${phone}`} className="block w-full bg-primary text-white py-4 rounded-2xl font-bold hover:bg-coffee-dark transition-colors text-center">
                Theo dõi đơn hàng ngay
              </Link>
            )}
            <Link href="/" className="block w-full bg-gray-50 text-gray-600 py-4 rounded-2xl font-bold hover:bg-gray-100 transition-colors border border-gray-200">
              Về trang chủ
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcf9f2] pb-32">
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/cart" className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tight">Thanh toán</h1>
        </div>

        <form onSubmit={handleCheckout} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Thông tin giao hàng */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-transparent hover:border-gray-100 transition-colors">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-xl font-black text-gray-800 uppercase">Thông tin giao hàng</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!isGuest && (
                  <div className="md:col-span-2 flex flex-col gap-2 mb-2">
                    <div className="flex items-center gap-3 bg-primary/5 border border-primary/10 rounded-xl px-4 py-3">
                      <div className="w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center font-black text-sm shrink-0">
                        {((user as any)?.fullName || (user as any)?.name || (user as any)?.userName || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{(user as any)?.fullName || (user as any)?.name || (user as any)?.userName || 'Thành viên'}</p>
                        <p className="text-xs text-gray-500">{(user as any)?.email || (user as any)?.userEmail || 'Chưa cập nhật Email'}</p>
                      </div>
                      <span className="ml-auto text-[10px] font-black text-primary bg-primary/10 px-2 py-1 rounded-full uppercase tracking-wide">Đã đăng nhập</span>
                    </div>
                  </div>
                )}
                {isGuest && (
                  <>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-bold text-gray-700 block">Họ và tên</label>
                      <input 
                        required 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nhập họ và tên" 
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 block">Số điện thoại</label>
                      <input 
                        required 
                        type="tel" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Nhập số điện thoại" 
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 block">Email (Bắt buộc để nhận thông báo)</label>
                      <input 
                        required 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Nhập địa chỉ email" 
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all" 
                      />
                    </div>
                  </>
                )}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-gray-700 block">Địa chỉ nhận hàng</label>
                  <input 
                    required 
                    type="text" 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện..." 
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all" 
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-gray-700 block">Ghi chú (Tùy chọn)</label>
                  <textarea 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ghi chú thêm cho quán (ví dụ: ít đá, không đường...)" 
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all resize-none h-24"
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Phương thức thanh toán */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-transparent hover:border-gray-100 transition-colors">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-xl font-black text-gray-800 uppercase">Phương thức thanh toán</h2>
              </div>
              
              <div className="space-y-3">
                <label className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-primary/30'}`}>
                  <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="w-5 h-5 accent-primary" />
                  <div className="flex-1 flex items-center gap-3">
                    <Truck className="w-6 h-6 text-gray-600" />
                    <div>
                      <p className="font-bold text-gray-800">Thanh toán khi nhận hàng (COD)</p>
                      <p className="text-xs text-gray-500">Thanh toán bằng tiền mặt khi shipper giao hàng.</p>
                    </div>
                  </div>
                </label>

                <label className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${paymentMethod === 'vnpay' ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-primary/30'}`}>
                  <input type="radio" name="payment" value="vnpay" checked={paymentMethod === 'vnpay'} onChange={() => setPaymentMethod('vnpay')} className="w-5 h-5 accent-primary" />
                  <div className="flex-1 flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center font-black text-[10px]">VN</div>
                    <div>
                      <p className="font-bold text-gray-800">Ví VNPay / Thẻ ngân hàng</p>
                      <p className="text-xs text-gray-500">Chuyển hướng đến cổng thanh toán VNPay.</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Đơn hàng (Order Summary readonly) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-6 shadow-sm sticky top-24">
              <h3 className="text-lg font-black text-gray-800 uppercase mb-4">Đơn hàng của bạn</h3>
              
              <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-start">
                    <div className="flex-1 pr-4">
                      <p className="font-bold text-sm text-gray-800">{item.quantity}x {item.name}</p>
                      <p className="text-xs text-gray-500">Size {item.sizeLabel}</p>
                      {item.toppings.length > 0 && (
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          + {item.toppings.map(t => t.name).join(", ")}
                        </p>
                      )}
                    </div>
                    <span className="font-bold text-sm text-gray-800 shrink-0">{(item.unitPrice * item.quantity).toLocaleString('vi-VN')}đ</span>
                  </div>
                ))}
              </div>

              {/* Voucher Input */}
              <div className="border-t border-gray-100 pt-6 mb-6">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Mã giảm giá (VD: GIAM10)"
                    value={voucherInput}
                    onChange={(e) => setVoucherInput(e.target.value)}
                    className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-primary/50 text-xs font-bold uppercase"
                  />
                  <button
                    onClick={handleApplyVoucher}
                    className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-coffee-dark transition-all shrink-0"
                  >
                    Áp dụng
                  </button>
                </div>
                {selectedVoucher && (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-xl mt-3 text-xs">
                    <span className="font-bold flex items-center gap-1">
                      <Ticket size={14} />
                      Đã áp dụng: {selectedVoucher.code}
                    </span>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedVoucher(null);
                        setVoucherInput("");
                        localStorage.removeItem('brewtra_applied_voucher');
                      }}
                      className="text-red-500 hover:text-red-700 font-bold ml-2"
                    >
                      Gỡ
                    </button>
                  </div>
                )}
              </div>

              {/* Danh sách Voucher Khả dụng */}
              {vouchers.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs font-bold text-gray-500 mb-2 uppercase">Voucher khả dụng:</p>
                  <div className="flex flex-col gap-2 max-h-36 overflow-y-auto pr-1">
                    {vouchers.map(v => {
                      const isDisabled = subTotal < v.minOrderAmount;
                      const isSelected = selectedVoucher?.code === v.code && selectedVoucher?.valid;
                      return (
                        <button
                          key={v.id}
                          disabled={isDisabled}
                          onClick={async (e) => {
                            e.preventDefault();
                            try {
                              const res = await voucherService.validateVoucher(v.code, subTotal);
                              if (res.success && res.data && res.data.valid) {
                                setSelectedVoucher(res.data);
                                setVoucherInput(res.data.code);
                                localStorage.setItem('brewtra_applied_voucher', res.data.code);
                                toast.success(`Đã áp dụng mã ${res.data.code}!`);
                              } else {
                                toast.error(res.data?.message || "Mã giảm giá không khả dụng!");
                              }
                            } catch (err) {
                              toast.error("Không thể áp dụng mã giảm giá này.");
                            }
                          }}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                            isSelected 
                              ? 'border-primary bg-primary/5' 
                              : isDisabled 
                                ? 'border-gray-100 opacity-50 cursor-not-allowed' 
                                : 'border-gray-100 hover:border-primary/30 bg-gray-50/30'
                          }`}
                        >
                          <div>
                            <p className="text-xs font-bold text-gray-800 uppercase">{v.code}</p>
                            <p className="text-[10px] text-gray-500">{v.name}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[10px] font-bold text-primary">
                              {v.discountType === 'PERCENTAGE' 
                                ? `${v.discountValue}%` 
                                : `${(v.discountValue / 1000).toLocaleString()}k`
                              }
                            </span>
                            {isDisabled && (
                              <p className="text-[8px] text-red-500 mt-0.5">Tối thiểu {(v.minOrderAmount / 1000).toLocaleString()}k</p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-3 text-sm font-medium text-gray-500 border-t border-gray-100 pt-6 mb-6">
                <div className="flex justify-between">
                  <span>Tạm tính</span>
                  <span className="text-gray-800 font-bold">{subTotal.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí giao hàng</span>
                  <span className="text-gray-800 font-bold">{shippingFee.toLocaleString('vi-VN')}đ</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Khuyến mãi</span>
                    <span className="font-bold">-{discount.toLocaleString('vi-VN')}đ</span>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-6 mb-8">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-gray-500 uppercase">Tổng thanh toán</span>
                  <span className="text-2xl font-black text-primary">
                    {total.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting || cartItems.length === 0}
                className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-coffee-dark shadow-lg shadow-primary/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Đang xử lý..." : "Đặt Hàng Ngay"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
