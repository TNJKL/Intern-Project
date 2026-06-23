"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCartStore } from "@/store/zustand/useCartStore";
import { useAuthStore } from "@/store/zustand/useAuthStore";
import { orderService } from "@/services/order.service";
import { voucherService } from "@/services/voucher.service";
import { paymentService } from "@/services/payment.service";
import type { Voucher, ValidateVoucherResult } from "@/services/voucher.service";
import toast from "react-hot-toast";
import { useSocket } from "@/components/providers/SocketProvider";

import CheckoutSuccess from "./CheckoutSuccess";
import CheckoutShippingForm from "./CheckoutShippingForm";
import CheckoutPaymentMethods from "./CheckoutPaymentMethods";
import CheckoutSummary from "./CheckoutSummary";

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
  const isGuest = !user;

  useEffect(() => {
    setMounted(true);
    const fetchVouchers = async () => {
      try {
        const res = await voucherService.getVouchers();
        if (res.success && res.data) {
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

  const checkVoucherEligibility = (code: string): { eligible: boolean; message?: string } => {
    const voucherInfo = vouchers.find(v => v.code.toUpperCase() === code.toUpperCase());
    if (!voucherInfo) return { eligible: true };

    const tier = voucherInfo.applicableTier || 'ALL';
    if (tier === 'ALL') return { eligible: true };

    if (!user) {
      return {
        eligible: false,
        message: "Mã giảm giá này chỉ dành cho thành viên. Vui lòng đăng nhập!"
      };
    }

    const userTier = (user.tier || 'MEMBER').toUpperCase();
    if (tier === 'VIP' && userTier !== 'VIP') {
      return {
        eligible: false,
        message: "Mã giảm giá này chỉ dành cho thành viên VIP!"
      };
    }

    return { eligible: true };
  };

  useEffect(() => {
    if (!mounted) return;
    const savedCode = localStorage.getItem('brewtra_applied_voucher');

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

  const handleApplyVoucherSelect = async (code: string) => {
    try {
      const res = await voucherService.validateVoucher(code, subTotal);
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
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      toast.error("Giỏ hàng của bạn đang trống!");
      return;
    }

    setIsSubmitting(true);
    try {
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
        const orderId = res.data.id;

        if (!user && res.data.guestSessionId) {
          const { guestSessionId, orderCode } = res.data;
          localStorage.setItem('brewtra_guest_session_id', guestSessionId);
          localStorage.setItem('brewtra_guest_order_code', orderCode);
          joinGuestRoom(guestSessionId);
        }

        // Xử lý chuyển hướng nếu chọn VNPay
        if (paymentMethod === "vnpay") {
          toast.loading("Đang kết nối tới cổng thanh toán VNPay...", { id: "payment-redirect" });
          
          let paymentUrl = "";
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              const paymentRes = await paymentService.getPaymentUrl(orderId);
              if (paymentRes.success && paymentRes.data.paymentUrl) {
                paymentUrl = paymentRes.data.paymentUrl;
                break;
              }
            } catch (err) {
              console.warn(`Attempt ${attempt} to fetch payment URL failed.`);
            }
            await new Promise(resolve => setTimeout(resolve, 500));
          }

          if (paymentUrl) {
            toast.success("Đang chuyển hướng...", { id: "payment-redirect" });
            clearCart();
            localStorage.removeItem('brewtra_applied_voucher');
            window.location.href = paymentUrl;
            return;
          } else {
            toast.error("Không thể kết nối đến cổng thanh toán lúc này. Bạn có thể thanh toán lại tại trang Lịch sử đơn hàng.", { id: "payment-redirect", duration: 6000 });
          }
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

  if (!mounted) return <div className="min-h-screen bg-secondary/30"></div>;

  return (
    <div className="min-h-screen bg-secondary/30 pb-32 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-12">
        <AnimatePresence mode="wait">
          {isSuccess ? (
            <CheckoutSuccess
              createdOrderCode={createdOrderCode}
              phone={phone}
              user={user}
            />
          ) : (
            <motion.div key="checkout-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Top Header */}
              <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                <Link href="/cart" className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors shrink-0 border border-gray-100">
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </Link>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-800 uppercase tracking-tight">Thanh toán</h1>
              </div>

              <form onSubmit={handleCheckout} className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
                {/* VÙNG BÊN TRÁI: Nhập thông tin khách & Phương thức thanh toán */}
                <div className="lg:col-span-2 space-y-6">
                  <CheckoutShippingForm
                    user={user}
                    isGuest={isGuest}
                    name={name}
                    setName={setName}
                    phone={phone}
                    setPhone={setPhone}
                    email={email}
                    setEmail={setEmail}
                    address={address}
                    setAddress={setAddress}
                    note={note}
                    setNote={setNote}
                  />

                  <CheckoutPaymentMethods
                    paymentMethod={paymentMethod}
                    setPaymentMethod={setPaymentMethod}
                  />
                </div>

                {/* VÙNG BÊN PHẢI: Chi tiết Đơn hàng / Tổng cộng & Voucher (Sticky) */}
                <div className="lg:col-span-1">
                  <CheckoutSummary
                    cartItems={cartItems}
                    vouchers={vouchers}
                    selectedVoucher={selectedVoucher}
                    setSelectedVoucher={setSelectedVoucher}
                    voucherInput={voucherInput}
                    setVoucherInput={setVoucherInput}
                    subTotal={subTotal}
                    shippingFee={shippingFee}
                    discount={discount}
                    total={total}
                    isSubmitting={isSubmitting}
                    handleApplyVoucher={handleApplyVoucher}
                    onApplyVoucherSelect={handleApplyVoucherSelect}
                  />
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}