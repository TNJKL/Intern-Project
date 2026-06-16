"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, Package, Clock, CheckCircle2,
  Truck, Coffee, Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { orderService, OrderDetail } from "@/services/order.service";
import { useSocket } from "@/components/providers/SocketProvider";
import { paymentService } from "@/services/payment.service";

const getStatusDisplay = (status: string) => {
  const s = status?.toUpperCase();
  switch (s) {
    case "PENDING": return { label: "Chờ xử lý", icon: Clock, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-200" };
    case "CONFIRMED": return { label: "Đã xác nhận", icon: CheckCircle2, color: "text-cyan-500", bg: "bg-cyan-50", border: "border-cyan-200" };
    case "PREPARING": return { label: "Đang pha chế", icon: Coffee, color: "text-purple-500", bg: "bg-purple-50", border: "border-purple-200" };
    case "READY": return { label: "Chờ giao", icon: Package, color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-200" };
    case "DELIVERING": return { label: "Đang giao hàng", icon: Truck, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" };
    case "COMPLETED": return { label: "Hoàn thành", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50", border: "border-green-200" };
    case "CANCELLED": return { label: "Đã hủy", icon: Package, color: "text-red-500", bg: "bg-red-50", border: "border-red-200" };
    default: return { label: "Mới đặt", icon: Clock, color: "text-gray-500", bg: "bg-gray-50", border: "border-gray-200" };
  }
};

// ─── COMPONENT TIMELINE: TỊNH TIẾN MƯỢT MÀ KHÔNG BỊ THỤT LÙI VỀ 0 ───
const OrderTimeline = ({ currentStatus }: { currentStatus: string }) => {
  const steps = [
    { id: "PENDING", label: "Đã nhận đơn" },
    { id: "CONFIRMED", label: "Đã xác nhận" },
    { id: "PREPARING", label: "Đang pha chế" },
    { id: "DELIVERING", label: "Đang giao" },
    { id: "COMPLETED", label: "Hoàn thành" },
  ];

  let currentStepIndex = steps.findIndex((s) => s.id === currentStatus?.toUpperCase());
  if (currentStatus?.toUpperCase() === "READY") currentStepIndex = 2; // Gom READY chung cụm pha chế xong
  if (currentStepIndex === -1 && currentStatus?.toUpperCase() !== "CANCELLED") currentStepIndex = 0;

  const lastWidthRef = useRef(0);
  if (currentStatus?.toUpperCase() !== 'CANCELLED') {
    lastWidthRef.current = (currentStepIndex / (steps.length - 1)) * 100;
  } else {
    lastWidthRef.current = 0;
  }

  return (
    <div className="relative mt-8 mb-6 px-2">
      {/* Thanh nền xám nhạt */}
      <div className="absolute top-4 left-0 w-full h-1 bg-gray-100 rounded-full z-0" />
      {/* Thanh màu tịnh tiến dùng CSS Transition */}
      <div
        className="absolute top-4 left-0 h-1 bg-primary rounded-full z-0 transition-all duration-1000 ease-out"
        style={{ width: `${lastWidthRef.current}%` }}
      />
      <div className="relative z-10 flex justify-between">
        {steps.map((step, index) => {
          const isCompleted = index <= currentStepIndex && currentStatus?.toUpperCase() !== 'CANCELLED';
          const isCurrentStep = index === currentStepIndex && currentStatus?.toUpperCase() !== 'CANCELLED';

          return (
            <div key={step.id} className="flex flex-col items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 border-2 ${isCompleted ? "bg-primary text-white border-primary shadow-lg shadow-primary/30 scale-110" : "bg-white text-gray-300 border-gray-200"}`}>
                {isCompleted ? "✓" : index + 1}
              </div>
              <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider text-center transition-all duration-500 ${isCurrentStep ? "text-primary font-black" : isCompleted ? "text-gray-600" : "text-gray-400"}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { joinGuestRoom } = useSocket(); // Đón hàm kích hoạt phòng Realtime

  const [orderCode, setOrderCode] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [isRepaying, setIsRepaying] = useState(false);

  const handleRepay = async () => {
    if (!orderDetail) return;
    setIsRepaying(true);
    try {
      const res = await paymentService.getPaymentUrl(orderDetail.id);
      if (res?.success && res?.data?.paymentUrl) {
        window.location.href = res.data.paymentUrl;
      } else {
        alert(res?.message || "Không thể lấy link thanh toán. Vui lòng thử lại sau.");
      }
    } catch (error: any) {
      console.error("Failed to recreate payment URL:", error);
      const errorMsg = error?.response?.data?.message || "Đã xảy ra lỗi khi tái tạo URL thanh toán.";
      alert(errorMsg);
    } finally {
      setIsRepaying(false);
    }
  };

  // 1. Tự động tra cứu khi phát hiện Query Params trên thanh URL điều hướng
  useEffect(() => {
    const codeParam = searchParams.get("code");
    const phoneParam = searchParams.get("phone");
    if (codeParam) {
      setOrderCode(codeParam);
      if (phoneParam) {
        setPhoneInput(phoneParam);
        handleTrackByCode(codeParam, phoneParam, true);
      }
    }
  }, [searchParams]);

  // ⚡ 2. ĐIỂM HỨNG SỰ KIỆN CUSTOM EVENT ĐỂ CẬP NHẬT GIAO DIỆN REALTIME KHÔNG CẦN F5
  useEffect(() => {
    const handleRealtimeStatusUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      const notifData = customEvent.detail;

      if (!orderDetail || !notifData) return;

      const incomingCode = notifData.orderCode;
      const incomingStatus = notifData.status;

      const isCodeMatched = incomingCode === orderDetail.orderCode;
      const isMessageContainsCode = notifData.body && String(notifData.body).includes(orderDetail.orderCode);

      if ((isCodeMatched || isMessageContainsCode) && incomingStatus) {
        console.log("🎯 [Khớp dữ liệu Realtime vãng lai] Tiến hành tịnh tiến trạng thái:", incomingStatus);
        setOrderDetail((prev) => {
          if (!prev) return null;
          if (prev.status?.toUpperCase() === incomingStatus?.toUpperCase()) return prev;
          return {
            ...prev,
            status: incomingStatus?.toUpperCase()
          };
        });
      }
    };

    window.addEventListener("order-status-updated", handleRealtimeStatusUpdate);
    return () => {
      window.removeEventListener("order-status-updated", handleRealtimeStatusUpdate);
    };
  }, [orderDetail]);

  const handleTrackByCode = async (code: string, phone?: string, isSilent = false) => {
    const cleanCode = code.trim();
    const cleanPhone = phone?.trim() || phoneInput.trim();
    if (!cleanCode || !cleanPhone) return;

    setIsLoading(true);
    setError(null);
    if (!isSilent) setOrderDetail(null);

    try {
      const res = await orderService.trackOrder(cleanCode, cleanPhone);
      if (res.success && res.data) {
        setOrderDetail(res.data);

        // Đón đầu giao tiếp mở rộng và giải quyết lỗi bóp chết type kiểm soát của TypeScript
        const orderData = res.data as OrderDetail & { guestSessionId?: string };

        if (orderData.guestSessionId) {
          console.log("🔍 Đã tìm thấy Guest Session ID hợp lệ, gửi yêu cầu tạo phòng:", orderData.guestSessionId);
          joinGuestRoom(orderData.guestSessionId);
        } else {
          console.warn("⚠️ API không trả về cấu trúc dữ liệu trường guestSessionId.");
        }

      } else {
        setError(res.message || "Không tìm thấy thông tin đơn hàng.");
      }
    } catch (err: any) {
      setError("Đã xảy ra lỗi khi kết nối dữ liệu đơn hàng.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcf9f2] pt-8 pb-32 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tight">Tra cứu đơn hàng vãng lai</h1>
        </div>

        {!orderDetail && (
          <div className="bg-white p-8 rounded-[32px] shadow-xl border border-gray-100/50">
            <div className="space-y-4">
              <input
                placeholder="Nhập mã đơn hàng của bạn"
                value={orderCode}
                onChange={(e) => setOrderCode(e.target.value)}
                className="w-full p-4 bg-gray-50 rounded-2xl border font-bold uppercase"
              />
              <input
                placeholder="Nhập số điện thoại mua hàng"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="w-full p-4 bg-gray-50 rounded-2xl border"
              />
              <button
                onClick={() => handleTrackByCode(orderCode, undefined, false)}
                className="w-full py-4 bg-[#4d362b] text-white rounded-2xl font-black uppercase shadow-lg disabled:opacity-50"
              >
                {isLoading ? "Đang truy vấn dữ liệu..." : "Bắt đầu tra cứu"}
              </button>
            </div>
            {error && <p className="text-red-500 text-sm mt-3 font-bold">{error}</p>}
          </div>
        )}

        {orderDetail && (
          <motion.div
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white p-8 rounded-[36px] shadow-xl border border-gray-100 overflow-hidden"
          >
            <div className="flex justify-between items-center mb-8 bg-gray-50 p-6 rounded-3xl border">
              <div>
                <span className="text-[10px] text-gray-400 block font-black uppercase">MÃ ĐƠN HÀNG</span>
                <span className="text-2xl font-black tracking-tight select-all">{orderDetail.orderCode}</span>
              </div>
              <span className={`px-4 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 transition-all duration-500 ${getStatusDisplay(orderDetail.status).bg} ${getStatusDisplay(orderDetail.status).color} ${getStatusDisplay(orderDetail.status).border}`}>
                {(() => {
                  const Icon = getStatusDisplay(orderDetail.status).icon;
                  return <Icon className="w-4 h-4" />;
                })()}
                {getStatusDisplay(orderDetail.status).label}
              </span>
            </div>

            <div className="space-y-8">
              {orderDetail.status?.toUpperCase() === 'PENDING' && orderDetail.paymentMethod?.toUpperCase() === 'VNPAY' && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                  <div>
                    <p className="font-bold text-sm">Đơn hàng chưa thanh toán xong!</p>
                    <p className="text-xs text-amber-700 font-medium">Vui lòng thanh toán trong vòng 15 phút để tránh đơn hàng bị tự động hủy.</p>
                  </div>
                  <button
                    onClick={handleRepay}
                    disabled={isRepaying}
                    className="bg-[#4d362b] text-white text-xs font-black uppercase px-4 py-2.5 rounded-xl hover:bg-[#3d2b22] transition-all flex items-center gap-1.5 shrink-0 shadow-sm disabled:opacity-50"
                  >
                    {isRepaying && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Thanh toán ngay
                  </button>
                </div>
              )}

              {orderDetail.status?.toUpperCase() !== "CANCELLED" && (
                <div className="border-t pt-6">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Trạng thái giao hàng</p>
                  <OrderTimeline currentStatus={orderDetail.status} />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6 bg-gray-50/50 p-6 rounded-3xl">
                <div>
                  <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Người nhận đơn hàng</p>
                  <p className="text-sm font-bold text-gray-800">{orderDetail.userName || "Khách vãng lai"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Số điện thoại liên hệ</p>
                  <p className="text-sm font-bold text-gray-800">{orderDetail.userPhone}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Địa chỉ nhận hàng</p>
                  <p className="text-sm font-medium text-gray-800">{orderDetail.deliveryAddress}</p>
                </div>
              </div>

              <div className="border-t pt-6 flex justify-between items-end">
                <div>
                  <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Tổng tiền thanh toán</p>
                  <p className="text-3xl font-black text-primary">{orderDetail.totalAmount?.toLocaleString("vi-VN")}đ</p>
                </div>
                <button
                  onClick={() => {
                    setOrderDetail(null);
                    router.push("/orders/track");
                  }}
                  className="px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition-colors uppercase tracking-wider text-xs"
                >
                  Tra cứu đơn khác
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fcf9f2] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    }>
      <TrackOrderContent />
    </Suspense>
  );
}