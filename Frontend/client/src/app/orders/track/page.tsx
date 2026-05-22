"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { 
  ChevronLeft, Search, Package, Clock, CheckCircle2, 
  Truck, Coffee, X, MapPin, CreditCard, Loader2,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { orderService, OrderDetail } from "@/services/order.service";
import toast from "react-hot-toast";

type OrderStatus = "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "DELIVERING" | "COMPLETED" | "CANCELLED" | string;

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

const renderTimeline = (currentStatus: string) => {
  const steps = [
    { id: "PENDING", label: "Đã nhận đơn" },
    { id: "CONFIRMED", label: "Đã xác nhận" },
    { id: "PREPARING", label: "Đang pha chế" },
    { id: "DELIVERING", label: "Đang giao" },
    { id: "COMPLETED", label: "Hoàn thành" },
  ];
  let currentStepIndex = steps.findIndex((s) => s.id === currentStatus?.toUpperCase());
  if (currentStepIndex === -1 && currentStatus?.toUpperCase() !== "CANCELLED") currentStepIndex = 0;

  return (
    <div className="relative mt-8 mb-6 px-2">
      <div className="absolute top-4 left-0 w-full h-1 bg-gray-100 rounded-full z-0" />
      <div
        className="absolute top-4 left-0 h-1 bg-primary rounded-full z-0 transition-all duration-1000"
        style={{ width: `${currentStatus?.toUpperCase() === 'CANCELLED' ? 0 : Math.max(0, (currentStepIndex / (steps.length - 1)) * 100)}%` }}
      />
      <div className="relative z-10 flex justify-between">
        {steps.map((step, index) => {
          const isCompleted = index <= currentStepIndex && currentStatus?.toUpperCase() !== 'CANCELLED';
          const isCurrent = index === currentStepIndex && currentStatus?.toUpperCase() !== 'CANCELLED';
          return (
            <div key={step.id} className="flex flex-col items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${isCompleted ? "bg-primary text-white shadow-lg shadow-primary/30 scale-110" : "bg-white text-gray-300 border-2 border-gray-200"}`}>
                {isCompleted ? "✓" : index + 1}
              </div>
              <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider text-center ${isCurrent ? "text-primary font-black" : isCompleted ? "text-gray-600" : "text-gray-400"}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface GuestOrderStorageItem {
  orderCode: string;
  email: string;
  createdAt: string;
  totalAmount: number;
  status: string;
  phone?: string;
  detail?: OrderDetail;
}

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [orderCode, setOrderCode] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Active tracking order detail
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    const codeParam = searchParams.get("code");
    const phoneParam = searchParams.get("phone");
    if (codeParam) {
      setOrderCode(codeParam);
      if (phoneParam) {
        setPhoneInput(phoneParam);
        handleTrackByCode(codeParam, phoneParam);
      }
    }
  }, [searchParams]);

  const handleTrackByCode = async (code: string, phone?: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) {
      toast.error("Vui lòng nhập mã đơn hàng!");
      return;
    }

    const cleanPhone = phone?.trim() || phoneInput.trim();
    if (!cleanPhone) {
      toast.error("Vui lòng nhập số điện thoại để tiếp tục!");
      return;
    }

    setIsLoading(true);
    setError(null);
    setOrderDetail(null);

    try {
      const res = await orderService.trackOrder(cleanCode, cleanPhone);
      if (res.success && res.data) {
        setOrderDetail(res.data);
        toast.success("Đã tìm thấy đơn hàng!");
      } else {
        setError(res.message || "Không tìm thấy đơn hàng với thông tin đã cung cấp.");
        toast.error("Không tìm thấy đơn hàng.");
      }
    } catch (err: any) {
      console.error(err);
      const apiErrMsg = err.response?.data?.message || "Không tìm thấy đơn hàng với thông tin đã nhập.";
      setError(apiErrMsg);
      toast.error("Không tìm thấy đơn hàng.");
    } finally {
      setIsLoading(false);
    }
  };


  const executeCancelOrder = async () => {
    if (!orderDetail) return;
    setIsCancelling(true);
    try {
      const res = await orderService.cancelOrder(orderDetail.id);
      if (res.success) {
        toast.success("Đã hủy đơn hàng thành công!");
        setShowCancelConfirm(false);
        
        // Cập nhật trạng thái CANCELLED trong localStorage ngay lập tức
        try {
          const guestOrdersJson = localStorage.getItem('brewtra_guest_orders');
          if (guestOrdersJson) {
            const guestOrders: GuestOrderStorageItem[] = JSON.parse(guestOrdersJson);
            const index = guestOrders.findIndex(o => o.orderCode === orderDetail.orderCode);
            if (index !== -1) {
              guestOrders[index].status = "CANCELLED";
              if (guestOrders[index].detail) {
                guestOrders[index].detail!.status = "CANCELLED";
              }
              localStorage.setItem('brewtra_guest_orders', JSON.stringify(guestOrders));
            }
          }
        } catch (e) {
          console.error("Lỗi khi cập nhật trạng thái CANCELLED trong localStorage", e);
        }
        
        // Refresh detail
        handleTrackByCode(orderDetail.orderCode, orderDetail.userPhone);
      } else {
        toast.error(res.message || "Không thể hủy đơn hàng.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Đã xảy ra lỗi khi hủy đơn hàng.");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcf9f2] pb-32">
      <div className="max-w-4xl mx-auto px-6 pt-8 pb-12">
        
        {/* Back header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tight">Tra cứu đơn hàng vãng lai</h1>
        </div>

        {/* Search layout */}
        {!orderDetail && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[32px] p-6 md:p-8 shadow-xl border border-gray-100/50 mb-8"
          >
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleTrackByCode(orderCode);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider block">Mã đơn hàng của bạn</label>
                  <input 
                    required
                    type="text" 
                    placeholder="Ví dụ: ORD-170425..." 
                    value={orderCode}
                    onChange={(e) => setOrderCode(e.target.value)}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary focus:bg-white transition-all text-sm tracking-wide uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider block">Số điện thoại mua hàng</label>
                  <input 
                    required
                    type="tel" 
                    placeholder="Ví dụ: 0987654321..." 
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary focus:bg-white transition-all text-sm"
                  />
                </div>
              </div>
              <div className="pt-2">
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#4d362b] text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-[#3c2a21] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#4d362b]/20 active:scale-[0.99]"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Tra cứu đơn hàng
                </button>
              </div>
            </form>

            {/* Error Notification */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }} 
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 text-xs font-bold"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p>{error}</p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Display detailed tracking information */}
        {orderDetail && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[36px] shadow-xl border border-gray-100 overflow-hidden"
          >
            {/* Header info detail */}
            <div className="p-6 md:p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
              <div>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Mã đơn hàng</p>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black text-gray-800 tracking-wide select-all">{orderDetail.orderCode}</h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${getStatusDisplay(orderDetail.status).bg} ${getStatusDisplay(orderDetail.status).color} ${getStatusDisplay(orderDetail.status).border}`}>
                    {(() => {
                      const Icon = getStatusDisplay(orderDetail.status).icon;
                      return <Icon className="w-3.5 h-3.5" />;
                    })()}
                    {getStatusDisplay(orderDetail.status).label}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2 font-medium">Đặt lúc: {new Date(orderDetail.createdAt).toLocaleString("vi-VN")}</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setOrderDetail(null);
                    setError(null);
                    // Nếu url có code, dọn dẹp nó
                    if (searchParams.get("code")) {
                      router.push("/orders/track");
                    }
                  }}
                  className="px-5 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-colors text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm"
                >
                  <Search className="w-4 h-4" />
                  Tra cứu đơn khác
                </button>
              </div>
            </div>


            {/* Dynamic Timeline of the order */}
            {orderDetail.status?.toUpperCase() !== "CANCELLED" && (
              <div className="p-6 md:p-8 bg-white border-b border-gray-100">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Trạng thái giao hàng</p>
                {renderTimeline(orderDetail.status)}
              </div>
            )}

            {/* Content grid */}
            <div className="p-6 md:p-8 space-y-6">
              
              {/* Delivery Info */}
              <div className="space-y-4">
                <h3 className="font-black text-gray-800 uppercase tracking-wider text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" /> Thông tin nhận hàng
                </h3>
                <div className="bg-gray-50/50 border border-gray-100 rounded-3xl p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Người nhận</p>
                      <p className="text-sm font-bold text-gray-800">{orderDetail.userName || "Khách vãng lai"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Số điện thoại</p>
                      <p className="text-sm font-bold text-gray-800">{orderDetail.userPhone}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Địa chỉ giao hàng</p>
                    <p className="text-sm font-medium text-gray-800 leading-relaxed">{orderDetail.deliveryAddress}</p>
                  </div>
                  {orderDetail.note && (
                    <div>
                      <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Ghi chú giao hàng</p>
                      <p className="text-sm font-medium text-gray-700 italic">"{orderDetail.note}"</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-4">
                <h3 className="font-black text-gray-800 uppercase tracking-wider text-sm flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-primary" /> Sản phẩm trong đơn hàng
                </h3>
                <div className="bg-gray-50/50 border border-gray-100 rounded-3xl p-6 space-y-4">
                  {orderDetail.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start border-b border-gray-100 pb-4 last:border-0 last:pb-0 last:mb-0">
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{item.quantity}x {item.productName}</p>
                        <p className="text-xs text-gray-500 mt-1">Size {item.variantLabel}</p>
                        {item.toppings && item.toppings.length > 0 && (
                          <p className="text-[10px] text-gray-400 mt-1 flex flex-wrap gap-1">
                            + Topping: {item.toppings.map(t => t.name).join(", ")}
                          </p>
                        )}
                      </div>
                      <p className="font-bold text-gray-800 text-sm">{item.subtotal?.toLocaleString("vi-VN")}đ</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Details */}
              <div className="space-y-4">
                <h3 className="font-black text-gray-800 uppercase tracking-wider text-sm flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" /> Chi tiết thanh toán
                </h3>
                <div className="bg-gray-50/50 border border-gray-100 rounded-3xl p-6 space-y-3">
                  <div className="flex justify-between text-xs text-gray-500 font-bold uppercase">
                    <span>Phương thức</span>
                    <span className="text-gray-800">{orderDetail.paymentMethod === "cod" ? "Thanh toán tiền mặt (COD)" : orderDetail.paymentMethod}</span>
                  </div>
                  <hr className="border-gray-100 my-2" />
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tạm tính</span>
                    <span className="font-bold text-gray-800">{orderDetail.subtotal?.toLocaleString()}đ</span>
                  </div>
                  {orderDetail.discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600 font-medium">
                      <span>Mã giảm giá</span>
                      <span className="font-bold">-{orderDetail.discountAmount?.toLocaleString()}đ</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Phí vận chuyển</span>
                    <span className="font-bold text-gray-800">15.000đ</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom summary bar */}
            <div className="p-6 md:p-8 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Tổng cộng thanh toán</p>
                <p className="text-3xl font-black text-primary">{orderDetail.totalAmount?.toLocaleString("vi-VN")}đ</p>
              </div>

              <div className="flex gap-3 w-full sm:w-auto">
                {orderDetail.status?.toUpperCase() === "PENDING" && (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="w-full sm:w-auto px-6 py-4 bg-red-50 text-red-500 rounded-2xl font-bold hover:bg-red-100 transition-colors uppercase tracking-wider text-xs flex items-center justify-center gap-2"
                  >
                    Hủy đơn hàng này
                  </button>
                )}
                
                <Link 
                  href="/menu" 
                  className="w-full sm:w-auto px-6 py-4 bg-[#4d362b] text-white rounded-2xl font-bold hover:bg-[#3c2a21] transition-colors uppercase tracking-wider text-xs text-center flex items-center justify-center gap-2 shadow-md"
                >
                  Tiếp tục mua sắm
                </Link>
              </div>
            </div>
          </motion.div>
        )}

      </div>

      {/* Confirmation Modal for Cancellation */}
      <AnimatePresence>
        {showCancelConfirm && (
          <div style={{ zIndex: 9999 }} className="fixed inset-0 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isCancelling && setShowCancelConfirm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl z-10 p-6 text-center"
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-black text-gray-800 mb-2">Yêu cầu hủy đơn hàng?</h3>
              <p className="text-gray-500 text-sm mb-8 leading-relaxed">Bạn có chắc chắn muốn hủy đơn hàng này không? Quyết định này không thể được hoàn tác sau khi thực hiện.</p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  disabled={isCancelling}
                  className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors uppercase tracking-wider text-xs disabled:opacity-50"
                >
                  Không, quay lại
                </button>
                <button
                  onClick={executeCancelOrder}
                  disabled={isCancelling}
                  className="flex-1 py-3.5 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors uppercase tracking-wider text-xs disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isCancelling && <Loader2 className="w-4 h-4 animate-spin" />}
                  Đồng ý hủy
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fcf9f2] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Đang tải trang tra cứu...</p>
      </div>
    }>
      <TrackOrderContent />
    </Suspense>
  );
}
