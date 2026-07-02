"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Package, Clock, CheckCircle2, Truck, Coffee, ArrowRight, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { orderService, OrderDetail } from "@/services/order.service";
import { OrderDetailModal } from "./OrderDetailModal";
import { apiClient } from "@/lib/api";
import { paymentService, PaymentDetail } from "@/services/payment.service";
import toast from "react-hot-toast";

interface OrderSummary {
  id: string;
  orderCode: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  paymentMethod?: string;
}

interface OrdersClientProps {
  initialOrders: OrderSummary[];
  isServerError?: boolean;
  initialTab?: string;
}

const ORDER_TABS = [
  { id: "active", label: "Đang giao" },
  { id: "history", label: "Lịch sử mua hàng" },
  { id: "transactions", label: "Lịch sử thanh toán VNPAY" },
];

const getStatusDisplay = (status: string) => {
  const s = status?.toUpperCase();
  switch (s) {
    case "PENDING": return { label: "Chờ xử lý", icon: Clock, color: "text-blue-600", bg: "bg-blue-50" };
    case "CONFIRMED": return { label: "Đã xác nhận", icon: CheckCircle2, color: "text-cyan-600", bg: "bg-cyan-50" };
    case "PREPARING": return { label: "Đang pha chế", icon: Coffee, color: "text-purple-600", bg: "bg-purple-50" };
    case "READY": return { label: "Chờ giao", icon: Package, color: "text-orange-600", bg: "bg-orange-50" };
    case "DELIVERING": return { label: "Đang giao hàng", icon: Truck, color: "text-primary", bg: "bg-primary/10" };
    case "COMPLETED": return { label: "Hoàn thành", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" };
    case "CANCELLED": return { label: "Đã hủy", icon: X, color: "text-red-600", bg: "bg-red-50" };
    default: return { label: "Mới đặt", icon: Clock, color: "text-gray-600", bg: "bg-gray-50" };
  }
};

export default function OrdersClient({ initialOrders, isServerError, initialTab = "active" }: OrdersClientProps) {
  const [orders, setOrders] = useState<OrderSummary[]>(initialOrders);
  const [isLoading, setIsLoading] = useState(isServerError && initialOrders.length === 0);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  // Payment States
  const [payments, setPayments] = useState<PaymentDetail[]>([]);
  const [isPaymentsLoading, setIsPaymentsLoading] = useState(false);
  const [paymentPage, setPaymentPage] = useState(0);
  const [paymentTotalPages, setPaymentTotalPages] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [repayingOrderId, setRepayingOrderId] = useState<string | null>(null);
  const [cancelConfirmOrder, setCancelConfirmOrder] = useState<OrderSummary | OrderDetail | null>(null);
  const [cancelReasonOption, setCancelReasonOption] = useState<string>("");
  const [customCancelReason, setCustomCancelReason] = useState<string>("");

  const handleRepay = async (orderId: string) => {
    setRepayingOrderId(orderId);
    try {
      const res = await paymentService.getPaymentUrl(orderId);
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
      setRepayingOrderId(null);
    }
  };

  useEffect(() => {
    if (isServerError) {
      const fetchOrders = async () => {
        setIsLoading(true);
        try {
          const res = await apiClient.get('/orders?size=100&sort=createdAt,desc');
          if (res.data?.success && res.data?.data) {
            setOrders(res.data.data);
          }
        } catch (error) {
          console.error("Failed to fetch orders client-side", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchOrders();
    }
  }, [isServerError]);

  // Đồng bộ props từ Server Component (sau khi router.refresh() hoàn tất)
  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  // Lắng nghe sự kiện WebSocket cập nhật trạng thái đơn hàng real-time
  useEffect(() => {
    const handleStatusUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { orderCode, status } = customEvent.detail || {};
      if (orderCode && status) {
        setOrders((prev) =>
          prev.map((o) =>
            o.orderCode === orderCode || o.id === orderCode
              ? { ...o, status: status }
              : o
          )
        );
      }
    };

    window.addEventListener("order-status-updated", handleStatusUpdate);
    return () => {
      window.removeEventListener("order-status-updated", handleStatusUpdate);
    };
  }, []);

  // Tải lịch sử thanh toán trực tuyến VNPAY
  const fetchPaymentHistory = async (page = 0) => {
    setIsPaymentsLoading(true);
    try {
      const res = await paymentService.getPaymentHistory(page, 10);
      if (res?.success && res?.data) {
        setPayments(res.data);
        if (res.page) {
          setPaymentTotalPages(res.page.totalPages);
          setPaymentPage(res.page.number);
        }
      }
    } catch (err) {
      console.error("Lỗi khi tải lịch sử thanh toán:", err);
      toast.error("Không thể tải lịch sử thanh toán");
    } finally {
      setIsPaymentsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "transactions") {
      fetchPaymentHistory(paymentPage);
    }
  }, [activeTab, paymentPage]);

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-secondary/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Đang tải đơn hàng...</span>
        </div>
      </div>
    );
  }

  const filteredOrders = orders.filter((order) => {
    const s = order.status.toLowerCase();
    if (activeTab === "active") return ["pending", "confirmed", "preparing", "ready", "delivering"].includes(s);
    return ["completed", "cancelled"].includes(s);
  });

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setCurrentPage(1);
  };

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const adjustedPage = Math.min(currentPage, Math.max(1, totalPages));
  const startIndex = (adjustedPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  const handleViewDetail = async (id: string) => {
    setIsModalOpen(true);
    setIsLoadingDetail(true);
    setOrderDetail(null);
    try {
      const res = await fetch(`/api/v1/orders/${id}`);
      const data = await res.json();
      if (data?.success && data?.data) {
        setOrderDetail(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch order detail", error);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleCancelOrder = (id: string) => {
    const targetOrder = orders.find((o) => o.id === id) || (orderDetail?.id === id ? orderDetail : null);
    setCancelConfirmOrder(targetOrder);
    setCancelConfirmId(id);
    setCancelReasonOption("");
    setCustomCancelReason("");
  };

  const executeCancelOrder = async () => {
    if (!cancelConfirmId) return;

    let finalReason = "Khách hủy đơn";
    const status = cancelConfirmOrder?.status?.toUpperCase();
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
      const res = await orderService.cancelOrder(cancelConfirmId, finalReason);
      if (res.success) {
        // Cập nhật trạng thái local state ngay lập tức sang CANCELLED
        setOrders((prev) =>
          prev.map((o) => (o.id === cancelConfirmId ? { ...o, status: "CANCELLED" } : o))
        );
        if (isModalOpen && orderDetail?.id === cancelConfirmId) {
          const detailRes = await fetch(`/api/v1/orders/${cancelConfirmId}`);
          const detailData = await detailRes.json();
          if (detailData?.success && detailData?.data) setOrderDetail(detailData.data);
        }
        setCancelConfirmId(null);
        setCancelConfirmOrder(null);
        router.refresh();
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

  const RenderTimelineComponent = ({ currentStatus }: { currentStatus: string }) => {
    const steps = [
      { id: "PENDING", label: "Đã nhận" },
      { id: "CONFIRMED", label: "Xác nhận" },
      { id: "PREPARING", label: "Pha chế" },
      { id: "DELIVERING", label: "Đang giao" },
      { id: "COMPLETED", label: "Xong" },
    ];
    let currentStepIndex = steps.findIndex((s) => s.id === currentStatus?.toUpperCase());
    if (currentStepIndex === -1 && currentStatus?.toUpperCase() !== "CANCELLED") currentStepIndex = 0;

    return (
      <div className="relative mt-6 mb-4 px-2 sm:px-6 w-full">
        <div className="absolute top-3 left-6 right-6 h-0.5 bg-gray-100 -translate-y-1/2 rounded-full z-0" />
        <div
          className="absolute top-3 left-6 h-0.5 bg-primary -translate-y-1/2 rounded-full z-0 transition-all duration-1000"
          style={{
            width: `${Math.max(0, (currentStepIndex / (steps.length - 1)) * 100)}%`
          }}
        />

        <div className="relative z-10 flex justify-between items-start w-full">
          {steps.map((step, index) => {
            const isCompleted = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;
            return (
              <div key={step.id} className="flex flex-col items-center gap-2 flex-1 text-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors duration-500 ${isCompleted ? "bg-primary text-white shadow-sm" : "bg-white text-gray-300 border border-gray-200"}`}>
                  {isCompleted ? "✓" : index + 1}
                </div>
                <span className={`text-[9px] md:text-[11px] font-bold uppercase tracking-wider block max-w-[65px] sm:max-w-none break-words ${isCurrent ? "text-primary" : isCompleted ? "text-gray-500" : "text-gray-400"}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full min-h-screen bg-secondary/30 pb-24 md:pb-32 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 md:pt-10 pb-12">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6 md:mb-8">
          <Link href="/" className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-primary/5 hover:bg-gray-50 transition-colors shrink-0">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-xl sm:text-2xl font-black text-gray-800 uppercase tracking-tight">Đơn hàng của bạn</h1>
        </div>

        {/* Tabs */}
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-primary/5 mb-6 md:mb-8">
          {ORDER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl transition-all ${activeTab === tab.id ? "bg-primary text-white shadow-md shadow-primary/10" : "text-gray-500 hover:text-primary"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className="space-y-4 sm:space-y-6">
          <AnimatePresence mode="wait">
            {activeTab === "transactions" ? (
              isPaymentsLoading && payments.length === 0 ? (
                <motion.div
                  key="loading-payments"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-20 flex flex-col items-center justify-center gap-3 bg-white rounded-xl shadow-sm border border-primary/5"
                >
                  <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Đang tải lịch sử giao dịch...</span>
                </motion.div>
              ) : payments.length === 0 ? (
                <motion.div
                  key="empty-payments"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white rounded-xl p-8 sm:p-12 text-center shadow-sm border border-primary/5 flex flex-col items-center"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-1">Chưa có giao dịch VNPAY</h3>
                  <p className="text-gray-500 mb-6 text-xs sm:text-sm">Bạn chưa có giao dịch thanh toán trực tuyến nào trên hệ thống.</p>
                  <Link href="/menu" className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors uppercase tracking-wider text-xs sm:text-sm">
                    Đặt hàng ngay
                  </Link>
                </motion.div>
              ) : (
                <motion.div
                  key="list-payments"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider bg-white p-4 rounded-xl border border-primary/5 shadow-xs">
                    <span>💡 Lịch sử giao dịch trực tuyến qua cổng VNPAY của bạn tại Brewtra Coffee.</span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm bg-white">
                    <table className="min-w-full divide-y divide-gray-200 text-left text-xs sm:text-sm">
                      <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-wider text-gray-400 whitespace-nowrap">
                        <tr>
                          <th className="px-6 py-4">Đơn hàng</th>
                          <th className="px-6 py-4">Ngày giao dịch</th>
                          <th className="px-6 py-4">Số tiền</th>
                          <th className="px-6 py-4">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                        {payments.map((p) => (
                          <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4.5 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <a
                                  href={`/orders/track?code=${p.orderCode}`}
                                  className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-xs"
                                >
                                  #{p.orderCode}
                                </a>
                              </div>
                            </td>
                            <td className="px-6 py-4.5 text-gray-500 font-semibold whitespace-nowrap">
                              {(() => {
                                const d = new Date(p.createdAt);
                                const pad = (n: number) => n.toString().padStart(2, '0');
                                const timeStr = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
                                const dateStr = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
                                return `${timeStr} - ${dateStr}`;
                              })()}
                            </td>
                            <td className="px-6 py-4.5 font-black text-gray-900 text-sm whitespace-nowrap">
                              {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p.amount)}
                            </td>
                            <td className="px-6 py-4.5 whitespace-nowrap">
                              {p.status === 'SUCCESS' && (
                                <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-green-50 text-green-700 border border-green-200 whitespace-nowrap">
                                  Thành công
                                </span>
                              )}
                              {p.status === 'PENDING' && (
                                <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
                                  Chờ xử lý
                                </span>
                              )}
                              {p.status === 'FAILED' && (
                                <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-red-50 text-red-700 border border-red-200 whitespace-nowrap">
                                  Thất bại
                                </span>
                              )}
                              {p.status === 'EXPIRED' && (
                                <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-gray-50 text-gray-500 border border-gray-200 whitespace-nowrap">
                                  Hết hạn
                                </span>
                              )}
                              {p.status === 'REFUNDED' && (
                                <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-50 text-slate-700 border border-slate-200 whitespace-nowrap">
                                  Đã hoàn tiền
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {paymentTotalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-150 pt-4 px-2">
                      <button
                        onClick={() => setPaymentPage(p => Math.max(0, p - 1))}
                        disabled={paymentPage === 0 || isPaymentsLoading}
                        className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-all shadow-xs"
                      >
                        Trang trước
                      </button>
                      <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                        Trang {paymentPage + 1} / {paymentTotalPages}
                      </span>
                      <button
                        onClick={() => setPaymentPage(p => Math.min(paymentTotalPages - 1, p + 1))}
                        disabled={paymentPage === paymentTotalPages - 1 || isPaymentsLoading}
                        className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-all shadow-xs"
                      >
                        Trang sau
                      </button>
                    </div>
                  )}
                </motion.div>
              )
            ) : filteredOrders.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-xl p-8 sm:p-12 text-center shadow-sm border border-primary/5 flex flex-col items-center"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Package className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-1">Chưa có đơn hàng nào</h3>
                <p className="text-gray-500 mb-6 text-xs sm:text-sm">Bạn chưa có đơn hàng nào trong mục này.</p>
                <Link href="/menu" className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors uppercase tracking-wider text-xs sm:text-sm">
                  Khám phá Menu
                </Link>
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4 sm:space-y-6"
              >
                {paginatedOrders.map((order) => {
                  const StatusInfo = getStatusDisplay(order.status);
                  const StatusIcon = StatusInfo.icon;
                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden flex flex-col"
                    >
                      {/* Phần trên: Thông tin đơn hàng & Trạng thái & Timeline */}
                      <div className="p-5 flex-1 bg-white">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-black text-gray-900 text-base sm:text-lg select-all">
                                #{order.orderCode || order.id.slice(0, 8).toUpperCase()}
                              </span>

                              {/* Badge Trạng thái */}
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold inline-flex items-center gap-1 ${StatusInfo.bg} ${StatusInfo.color}`}>
                                <StatusIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                {StatusInfo.label}
                              </span>
                            </div>
                            <p className="text-[11px] sm:text-xs text-gray-400 font-semibold tracking-wide">
                              Đặt lúc: {new Date(order.createdAt).toLocaleString('vi-VN')}
                            </p>
                          </div>
                        </div>

                        {/* Timeline */}
                        {activeTab === "active" && order.status?.toLowerCase() !== "cancelled" && (
                          <div className="mt-4 overflow-x-auto scrollbar-none py-1">
                            <div className="w-full">
                              <RenderTimelineComponent currentStatus={order.status} />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Phần dưới: Tổng tiền & Các nút Action */}
                      <div className="px-5 py-4 bg-gray-50/50 border-t border-dashed border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-baseline gap-1.5 shrink-0">
                          <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Tổng tiền:</span>
                          <span className="text-lg sm:text-xl font-black text-primary">
                            {order.totalAmount?.toLocaleString("vi-VN") ?? 0}đ
                          </span>
                        </div>

                        {/* Nhóm button actions */}
                        <div className="flex gap-2 w-full sm:w-auto justify-end">
                          {["pending", "confirmed"].includes(order.status?.toLowerCase()) && (
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              className="flex-1 sm:flex-initial px-4.5 py-2.5 bg-red-50 hover:bg-red-100 active:scale-98 text-red-700 rounded-xl font-extrabold transition-all text-xs uppercase tracking-wider border border-red-100 text-center"
                            >
                              Hủy đơn
                            </button>
                          )}
                          {order.status?.toLowerCase() === "completed" && (
                            <button className="flex-1 sm:flex-initial px-4.5 py-2.5 bg-primary/5 text-primary rounded-xl font-extrabold hover:bg-primary/10 transition-all text-xs uppercase tracking-wider text-center">
                              Đánh giá
                            </button>
                          )}
                          {order.status?.toUpperCase() === "PENDING" && order.paymentMethod?.toUpperCase() === "VNPAY" && (
                            <button
                              onClick={() => handleRepay(order.id)}
                              disabled={repayingOrderId !== null}
                              className="flex-1 sm:flex-initial px-4.5 py-2.5 bg-amber-500 text-white rounded-xl font-extrabold hover:bg-amber-600 active:scale-98 transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
                            >
                              {repayingOrderId === order.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                              Thanh toán ngay
                            </button>
                          )}
                          <button
                            onClick={() => handleViewDetail(order.id)}
                            className="flex-1 sm:flex-initial justify-center px-5 py-2.5 bg-primary text-white rounded-xl font-extrabold hover:bg-primary/95 active:scale-98 transition-all text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
                          >
                            Xem chi tiết
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-8 bg-white p-4 rounded-xl shadow-sm border border-primary/5">
              <span className="text-xs sm:text-sm font-medium text-gray-500 text-center md:text-left">
                Hiển thị <strong className="text-primary font-black">{filteredOrders.length > 0 ? (adjustedPage - 1) * itemsPerPage + 1 : 0} - {Math.min(adjustedPage * itemsPerPage, filteredOrders.length)}</strong> / <strong className="text-primary font-black">{filteredOrders.length}</strong> đơn
              </span>
              <div className="flex items-center justify-between w-full md:w-auto gap-2">
                <button
                  disabled={adjustedPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="px-3 py-2 bg-gray-50 text-primary rounded-xl font-bold hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-gray-50 transition-all text-xs flex items-center gap-1 border border-gray-200/50 grow md:grow-0 justify-center"
                >
                  <ChevronLeft className="w-4 h-4" /> Trước
                </button>
                <button
                  disabled={adjustedPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="px-3 py-2 bg-gray-50 text-primary rounded-xl font-bold hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-gray-50 transition-all text-xs flex items-center gap-1 border border-gray-200/50 grow md:grow-0 justify-center"
                >
                  Sau <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Chi Tiết */}
      <AnimatePresence>
        {isModalOpen && (
          <OrderDetailModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            orderDetail={orderDetail}
            isLoading={isLoadingDetail}
            isCancelling={isCancelling}
            onCancelOrder={handleCancelOrder}
          />
        )}
      </AnimatePresence>

      {/* Confirmation Modal Hủy Đơn */}
      <AnimatePresence>
        {cancelConfirmId && cancelConfirmOrder && (
          <div style={{ zIndex: 9999 }} className="fixed inset-0 flex items-center justify-center p-4">
            <motion.div
              key="cancel-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isCancelling && (setCancelConfirmId(null), setCancelConfirmOrder(null))}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              key="cancel-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl z-10 p-6"
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
                <div className="mb-5 text-left">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Lý do hủy đơn hàng <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={cancelReasonOption}
                    onChange={(e) => setCancelReasonOption(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 focus:outline-none focus:border-primary focus:bg-white transition-all mb-3"
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
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 focus:outline-none focus:border-primary focus:bg-white transition-all placeholder:text-gray-400 placeholder:font-semibold"
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
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}