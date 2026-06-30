"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, Package, Clock, CheckCircle2,
  Truck, Coffee, Loader2, XCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { orderService, OrderDetail } from "@/services/order.service";
import { useSocket } from "@/components/providers/SocketProvider";
import { paymentService } from "@/services/payment.service";
import { OrderDetailSkeleton } from "../components/OrderDetailSkeleton";
import { OrderDetailModal } from "../components/OrderDetailModal";

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
  const hasQueryParams = !!searchParams.get("code") && !!searchParams.get("phone");

  const [orderCode, setOrderCode] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [isRepaying, setIsRepaying] = useState(false);

  // States cho việc xem chi tiết và hủy đơn hàng
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [cancelConfirmOrder, setCancelConfirmOrder] = useState<OrderDetail | null>(null);
  const [cancelReasonOption, setCancelReasonOption] = useState<string>("");
  const [customCancelReason, setCustomCancelReason] = useState<string>("");

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

  const handleCancelOrder = (id: string) => {
    if (orderDetail) {
      setCancelConfirmOrder(orderDetail);
      setCancelConfirmId(orderDetail.id);
      setCancelReasonOption("");
      setCustomCancelReason("");
    }
  };

  const executeCancelOrder = async () => {
    if (!cancelConfirmId || !orderDetail) return;

    let finalReason = "Khách hủy đơn";
    const status = orderDetail.status?.toUpperCase();
    if (status === "CONFIRMED") {
      if (!cancelReasonOption) {
        alert("Vui lòng chọn lý do hủy đơn hàng");
        return;
      }
      if (cancelReasonOption === "Khác") {
        if (!customCancelReason.trim()) {
          alert("Vui lòng nhập lý do hủy đơn hàng");
          return;
        }
        finalReason = customCancelReason.trim();
      } else {
        finalReason = cancelReasonOption;
      }
    }

    setIsCancelling(true);
    try {
      const res = await orderService.guestCancelOrder(cancelConfirmId, phoneInput, finalReason);
      if (res.success) {
        setOrderDetail((prev) => {
          if (!prev) return null;
          return { ...prev, status: "CANCELLED", cancellationReason: finalReason };
        });
        setCancelConfirmId(null);
        setCancelConfirmOrder(null);
      } else {
        alert(res.message || "Lỗi khi hủy đơn hàng");
      }
    } catch (error) {
      console.error("Failed to cancel order", error);
      alert("Đã xảy ra lỗi khi hủy đơn hàng");
    } finally {
      setIsCancelling(false);
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

      const isCodeMatched = incomingCode?.toUpperCase() === orderDetail.orderCode?.toUpperCase();
      const isMessageContainsCode = notifData.body && String(notifData.body).toUpperCase().includes(orderDetail.orderCode?.toUpperCase());

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

    // 1. Thực hiện validate dữ liệu nhập
    if (!cleanCode) {
      setError("Vui lòng nhập Mã đơn hàng cần tra cứu!");
      return;
    }
    if (!cleanPhone) {
      setError("Vui lòng nhập Số điện thoại mua hàng!");
      return;
    }
    const phoneRegex = /^(03|05|07|08|09)\d{8}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setError("Số điện thoại không đúng định dạng (phải gồm 10 chữ số và bắt đầu bằng 03, 05, 07, 08, 09)!");
      return;
    }

    setIsLoading(true);
    setError(null);
    if (!isSilent) setOrderDetail(null);

    try {
      const res = await orderService.trackOrder(cleanCode, cleanPhone);
      if (res.success && res.data) {
        setOrderDetail(res.data);

        // Cập nhật Query Params lên URL để khi F5 không bị đá văng về form nhập
        const params = new URLSearchParams(window.location.search);
        if (params.get("code") !== cleanCode || params.get("phone") !== cleanPhone) {
          router.push(`/orders/track?code=${encodeURIComponent(cleanCode)}&phone=${encodeURIComponent(cleanPhone)}`, { scroll: false });
        }

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
      // 2. Trích xuất thông điệp lỗi chi tiết từ Server
      const serverMessage = err.response?.data?.message || err.message;
      setError(serverMessage || "Đã xảy ra lỗi khi kết nối dữ liệu đơn hàng.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary/30 pt-8 pb-32 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tight">Tra cứu đơn hàng vãng lai</h1>
        </div>

        {/* 1. Màn hình Skeleton Loading khi tự động tra cứu từ URL link */}
        {isLoading && !orderDetail && hasQueryParams && (
          <OrderDetailSkeleton />
        )}

        {/* 2. Form Nhập truy vấn (chỉ hiện khi chưa có orderDetail và không trong quá trình tự động loading từ URL) */}
        {!orderDetail && (!isLoading || !hasQueryParams) && (
          <div className="bg-white p-8 rounded-xl shadow-md border border-gray-150/80 max-w-xl mx-auto">
            <h2 className="text-lg font-bold text-gray-800 mb-6 text-center uppercase tracking-wide">Tra cứu đơn hàng</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Mã đơn hàng</label>
                <input
                  placeholder="Ví dụ: ORD-123456"
                  value={orderCode}
                  onChange={(e) => setOrderCode(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50/50 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black font-bold uppercase transition-all outline-none"
                />
                <p className="text-[11px] text-gray-500 font-semibold mt-2.5 leading-relaxed flex items-start gap-1">
                  <span className="text-amber-500 text-xs mt-0.5 shrink-0">💡</span>
                  <span>
                    Bạn có thể tìm thấy mã này trong <span className="text-primary font-black">Email xác nhận hóa đơn</span> hệ thống gửi ngay sau khi đặt hàng thành công.
                  </span>
                </p>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Số điện thoại mua hàng</label>
                <input
                  placeholder="Ví dụ: 0987654321"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50/50 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black font-semibold transition-all outline-none"
                />
              </div>
              <button
                onClick={() => handleTrackByCode(orderCode, undefined, false)}
                className="w-full py-3.5 bg-primary text-white rounded-xl font-black uppercase shadow-md hover:bg-primary/95 active:scale-98 transition-all disabled:opacity-50 tracking-wider text-sm mt-2"
              >
                {isLoading ? "Đang truy vấn dữ liệu..." : "Bắt đầu tra cứu"}
              </button>
            </div>

            {error && <p className="text-red-600 text-xs mt-4 font-bold bg-red-50 border border-red-100 px-3 py-2 rounded-lg text-center">{error}</p>}
          </div>
        )}

        {orderDetail && (
          <motion.div
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white p-8 rounded-xl shadow-md border border-gray-150/80 overflow-hidden"
          >
            {/* Banner hiển thị lý do hủy đơn nếu đơn bị hủy */}
            {orderDetail.status?.toUpperCase() === "CANCELLED" && (
              <div className="mb-6 bg-red-50/60 border border-red-100 rounded-xl p-4 flex gap-3 items-start text-left animate-fadeIn">
                <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-red-950">Đơn hàng đã bị hủy</p>
                  <p className="text-xs text-red-700/90 leading-relaxed font-semibold">
                    Lý do: <span className="font-black text-red-800">{orderDetail.cancellationReason || "Không có lý do cụ thể"}</span>
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mb-8 bg-gray-50 p-6 rounded-xl border border-gray-100">
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
                <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-xl flex items-center justify-between gap-3 shadow-xs">
                  <div>
                    <p className="font-bold text-sm">Đơn hàng chưa thanh toán xong!</p>
                    <p className="text-xs text-amber-700 font-medium">Vui lòng thanh toán trong vòng 15 phút để tránh đơn hàng bị tự động hủy.</p>
                  </div>
                  <button
                    onClick={handleRepay}
                    disabled={isRepaying}
                    className="bg-primary text-white text-xs font-black uppercase px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-all flex items-center gap-1.5 shrink-0 shadow-sm disabled:opacity-50"
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

              {/* Tái thiết kế Bố cục Thông tin Người nhận bằng Bordered Grid Table */}
              <div className="border-t pt-6">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Thông tin giao nhận</p>
                <div className="border border-black rounded-xl overflow-hidden bg-white shadow-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="bg-gray-50/20 border-b md:border-r border-black p-4 flex flex-col justify-center">
                      <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1">Người nhận hàng</span>
                      <span className="font-bold text-gray-800 text-sm">{orderDetail.userName || "Khách vãng lai"}</span>
                    </div>
                    <div className="bg-gray-50/20 border-b border-black p-4 flex flex-col justify-center">
                      <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1">Số điện thoại liên hệ</span>
                      <span className="font-bold text-gray-800 text-sm">{orderDetail.userPhone}</span>
                    </div>
                    <div className="col-span-1 md:col-span-2 bg-gray-50/20 p-4 flex flex-col justify-center">
                      <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1">Địa chỉ giao hàng</span>
                      <span className="font-semibold text-gray-700 text-sm">{orderDetail.deliveryAddress}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6 flex flex-wrap justify-between items-center gap-4">
                <div>
                  <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Tổng tiền thanh toán</p>
                  <p className="text-3xl font-black text-primary">{orderDetail.totalAmount?.toLocaleString("vi-VN")}đ</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Nút hủy đơn hàng: Chỉ hiện khi trạng thái là PENDING hoặc CONFIRMED */}
                  {["PENDING", "CONFIRMED"].includes(orderDetail.status?.toUpperCase()) && (
                    <button
                      onClick={() => handleCancelOrder(orderDetail.id)}
                      className="px-5 py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-xl font-bold transition-all uppercase tracking-wider text-xs flex items-center gap-1 shadow-sm"
                    >
                      Hủy đơn hàng
                    </button>
                  )}
                  {/* Nút xem chi tiết sản phẩm đã mua */}
                  <button
                    onClick={() => setIsDetailModalOpen(true)}
                    className="px-5 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl font-bold transition-all uppercase tracking-wider text-xs flex items-center gap-1 shadow-sm"
                  >
                    Xem chi tiết
                  </button>
                  {/* Nút tra cứu đơn khác */}
                  <button
                    onClick={() => {
                      setOrderDetail(null);
                      router.push("/orders/track");
                    }}
                    className="px-5 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all uppercase tracking-wider text-xs shadow-xs"
                  >
                    Tra cứu đơn khác
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Modal Chi Tiết */}
        <AnimatePresence>
          {isDetailModalOpen && (
            <OrderDetailModal
              isOpen={isDetailModalOpen}
              onClose={() => setIsDetailModalOpen(false)}
              orderDetail={orderDetail}
              isLoading={false}
              isCancelling={isCancelling}
              onCancelOrder={handleCancelOrder}
              guestPhone={phoneInput}
            />
          )}
        </AnimatePresence>

        {/* Confirmation Modal Hủy Đơn */}
        <AnimatePresence>
          {cancelConfirmId && cancelConfirmOrder && (
            <motion.div
              key="cancel-modal-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ zIndex: 9999 }}
              className="fixed inset-0 flex items-center justify-center p-4"
            >
              <div
                onClick={() => !isCancelling && (setCancelConfirmId(null), setCancelConfirmOrder(null))}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                key="cancel-modal"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-white rounded-xl overflow-hidden shadow-2xl z-10 p-6 text-center"
              >
                <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-7 h-7 text-red-500" />
                </div>
                <h3 className="text-lg sm:text-xl font-black text-gray-800 mb-1 text-center">Hủy đơn hàng?</h3>
                <p className="text-gray-500 text-xs sm:text-sm mb-4 leading-relaxed text-center">
                  Bạn có chắc chắn muốn hủy đơn hàng này không? Hành động này không thể hoàn tác.
                </p>

                {/* Yêu cầu lý do hủy đối với đơn CONFIRMED */}
                {cancelConfirmOrder.status?.toUpperCase() === "CONFIRMED" && (
                  <div className="mb-5 text-left animate-fadeIn">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Lý do hủy đơn hàng <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={cancelReasonOption}
                      onChange={(e) => setCancelReasonOption(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 focus:outline-none focus:border-black transition-all mb-3 outline-none"
                    >
                      <option value="">-- Chọn lý do hủy đơn --</option>
                      <option value="Tôi đặt nhầm món">Tôi đặt nhầm món</option>
                      <option value="Tôi muốn thay đổi địa chỉ giao hàng">Tôi muốn thay đổi địa chỉ giao hàng</option>
                      <option value="Tôi tìm được chỗ khác">Tôi tìm được chỗ khác</option>
                      <option value="Đổi phương thức thanh toán">Đổi phương thức thanh toán</option>
                      <option value="Khác">Khác (Nhập lý do khác)</option>
                    </select>

                    {cancelReasonOption === "Khác" && (
                      <textarea
                        placeholder="Nhập lý do chi tiết của bạn..."
                        value={customCancelReason}
                        onChange={(e) => setCustomCancelReason(e.target.value)}
                        rows={3}
                        className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 focus:outline-none focus:border-black transition-all placeholder:text-gray-400 placeholder:font-semibold outline-none"
                      />
                    )}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => (setCancelConfirmId(null), setCancelConfirmOrder(null))}
                    disabled={isCancelling}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors uppercase tracking-wider text-xs disabled:opacity-50"
                  >
                    Không
                  </button>
                  <button
                    onClick={executeCancelOrder}
                    disabled={
                      isCancelling ||
                      (cancelConfirmOrder.status?.toUpperCase() === "CONFIRMED" &&
                        (!cancelReasonOption || (cancelReasonOption === "Khác" && !customCancelReason.trim())))
                    }
                    className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors uppercase tracking-wider text-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {isCancelling && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Đồng ý
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    }>
      <TrackOrderContent />
    </Suspense>
  );
}