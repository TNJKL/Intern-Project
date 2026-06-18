"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Package, Clock, CheckCircle2, Truck, Coffee, ArrowRight, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { orderService, OrderDetail } from "@/services/order.service";
import { OrderDetailModal } from "./OrderDetailModal";
import { apiClient } from "@/lib/api";
import { paymentService } from "@/services/payment.service";

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
}

const ORDER_TABS = [
  { id: "active", label: "Đang giao" },
  { id: "history", label: "Lịch sử mua hàng" },
];

const getStatusDisplay = (status: string) => {
  const s = status?.toUpperCase();
  switch (s) {
    case "PENDING": return { label: "Chờ xử lý", icon: Clock, color: "text-blue-600", bg: "bg-blue-50" };
    case "CONFIRMED": return { label: "Đã xác nhận", icon: CheckCircle2, color: "text-cyan-600", bg: "bg-cyan-50" };
    case "PREPARING": return { label: "Đang pha chế", icon: Coffee, color: "text-purple-600", bg: "bg-purple-50" };
    case "READY": return { label: "Chờ giao", icon: Package, color: "text-orange-600", bg: "bg-orange-50" };
    case "DELIVERING": return { label: "Đang giao hàng", icon: Truck, color: "text-[#5c3d2e]", bg: "bg-[#5c3d2e]/10" };
    case "COMPLETED": return { label: "Hoàn thành", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" };
    case "CANCELLED": return { label: "Đã hủy", icon: X, color: "text-red-600", bg: "bg-red-50" };
    default: return { label: "Mới đặt", icon: Clock, color: "text-gray-600", bg: "bg-gray-50" };
  }
};

export default function OrdersClient({ initialOrders, isServerError }: OrdersClientProps) {
  const [orders, setOrders] = useState<OrderSummary[]>(initialOrders);
  const [isLoading, setIsLoading] = useState(isServerError && initialOrders.length === 0);
  const [activeTab, setActiveTab] = useState("active");
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [repayingOrderId, setRepayingOrderId] = useState<string | null>(null);

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

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-[#fdf3eb]/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-[#5c3d2e] animate-spin" />
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
    setCancelConfirmId(id);
  };

  const executeCancelOrder = async () => {
    if (!cancelConfirmId) return;
    setIsCancelling(true);
    try {
      const res = await orderService.cancelOrder(cancelConfirmId);
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
          className="absolute top-3 left-6 h-0.5 bg-[#5c3d2e] -translate-y-1/2 rounded-full z-0 transition-all duration-1000"
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
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors duration-500 ${isCompleted ? "bg-[#5c3d2e] text-white shadow-sm" : "bg-white text-gray-300 border border-gray-200"}`}>
                  {isCompleted ? "✓" : index + 1}
                </div>
                <span className={`text-[9px] md:text-[11px] font-bold uppercase tracking-wider block max-w-[65px] sm:max-w-none break-words ${isCurrent ? "text-[#5c3d2e]" : isCompleted ? "text-gray-500" : "text-gray-400"}`}>
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
    <div className="w-full min-h-screen bg-[#fdf3eb]/30 pb-24 md:pb-32 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 md:pt-10 pb-12">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6 md:mb-8">
          <Link href="/" className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-[#91461e]/5 hover:bg-gray-50 transition-colors shrink-0">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-xl sm:text-2xl font-black text-gray-800 uppercase tracking-tight">Đơn hàng của bạn</h1>
        </div>

        {/* Tabs */}
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-[#91461e]/5 mb-6 md:mb-8">
          {ORDER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl transition-all ${activeTab === tab.id ? "bg-[#5c3d2e] text-white shadow-md shadow-[#5c3d2e]/10" : "text-gray-500 hover:text-[#5c3d2e]"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className="space-y-4 sm:space-y-6">
          <AnimatePresence mode="wait">
            {filteredOrders.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center shadow-sm border border-[#91461e]/5 flex flex-col items-center"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Package className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-1">Chưa có đơn hàng nào</h3>
                <p className="text-gray-500 mb-6 text-xs sm:text-sm">Bạn chưa có đơn hàng nào trong mục này.</p>
                <Link href="/menu" className="bg-[#5c3d2e] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#5c3d2e]/90 transition-colors uppercase tracking-wider text-xs sm:text-sm">
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
                      className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-[#91461e]/5 hover:shadow-md transition-all duration-300"
                    >
                      {/* Order Item Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-gray-100 pb-4">
                        <div className="flex items-start sm:items-center justify-between sm:justify-start gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="font-extrabold text-gray-800 text-base sm:text-lg">{order.orderCode || order.id}</span>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold inline-flex items-center gap-1 ${StatusInfo.bg} ${StatusInfo.color}`}>
                                <StatusIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                {StatusInfo.label}
                              </span>
                            </div>
                            <p className="text-[11px] sm:text-xs text-gray-400 font-medium">Đặt lúc: {new Date(order.createdAt).toLocaleString('vi-VN')}</p>
                          </div>
                        </div>

                        <div className="flex sm:flex-col justify-between sm:justify-start items-center sm:items-end bg-gray-50 sm:bg-transparent p-2 sm:p-0 rounded-xl">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider sm:mb-0.5 pl-2 sm:pl-0">Tổng tiền</p>
                          <p className="text-base sm:text-xl font-black text-[#5c3d2e] pr-2 sm:pr-0">{order.totalAmount?.toLocaleString("vi-VN") ?? 0}đ</p>
                        </div>
                      </div>

                      {/* Timeline */}
                      {activeTab === "active" && order.status?.toLowerCase() !== "cancelled" && (
                        <div className="mb-6 overflow-x-auto scrollbar-none py-1">
                          <div className="w-full">
                            <RenderTimelineComponent currentStatus={order.status} />
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex justify-end gap-2 mt-2 w-full sm:w-auto">
                        {["pending", "confirmed"].includes(order.status?.toLowerCase()) && (
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            className="flex-1 sm:flex-initial px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl font-extrabold transition-colors text-xs uppercase tracking-wider border border-red-200 text-center"
                          >
                            Hủy đơn
                          </button>
                        )}
                        {order.status?.toLowerCase() === "completed" && (
                          <button className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#5c3d2e]/5 text-[#5c3d2e] rounded-xl font-extrabold hover:bg-[#5c3d2e]/10 transition-colors text-xs uppercase tracking-wider">
                            Đánh giá
                          </button>
                        )}
                        {order.status?.toUpperCase() === "PENDING" && order.paymentMethod?.toUpperCase() === "VNPAY" && (
                          <button
                            onClick={() => handleRepay(order.id)}
                            disabled={repayingOrderId !== null}
                            className="flex-1 sm:flex-initial px-4 py-2.5 bg-amber-500 text-white rounded-xl font-extrabold hover:bg-amber-600 transition-colors text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                          >
                            {repayingOrderId === order.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            Thanh toán ngay
                          </button>
                        )}
                        <button
                          onClick={() => handleViewDetail(order.id)}
                          className={`${
                            ["pending", "confirmed", "completed"].includes(order.status?.toLowerCase())
                              ? "flex-1 sm:flex-initial"
                              : "w-full"
                          } sm:w-auto justify-center px-5 py-2.5 bg-[#5c3d2e] text-white rounded-xl font-extrabold hover:bg-[#5c3d2e]/90 transition-colors text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm`}
                        >
                          {order.status?.toLowerCase() === "completed" || order.status?.toLowerCase() === "cancelled" ? "Mua lại đơn này" : "Xem chi tiết"}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-8 bg-white p-4 rounded-2xl shadow-sm border border-[#91461e]/5">
              <span className="text-xs sm:text-sm font-medium text-gray-500 text-center md:text-left">
                Hiển thị <strong className="text-[#5c3d2e] font-black">{filteredOrders.length > 0 ? (adjustedPage - 1) * itemsPerPage + 1 : 0} - {Math.min(adjustedPage * itemsPerPage, filteredOrders.length)}</strong> / <strong className="text-[#5c3d2e] font-black">{filteredOrders.length}</strong> đơn
              </span>
              <div className="flex items-center justify-between w-full md:w-auto gap-2">
                <button
                  disabled={adjustedPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="px-3 py-2 bg-gray-50 text-[#5c3d2e] rounded-xl font-bold hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-gray-50 transition-all text-xs flex items-center gap-1 border border-gray-200/50 grow md:grow-0 justify-center"
                >
                  <ChevronLeft className="w-4 h-4" /> Trước
                </button>
                <button
                  disabled={adjustedPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="px-3 py-2 bg-gray-50 text-[#5c3d2e] rounded-xl font-bold hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-gray-50 transition-all text-xs flex items-center gap-1 border border-gray-200/50 grow md:grow-0 justify-center"
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
        {cancelConfirmId && (
          <div style={{ zIndex: 9999 }} className="fixed inset-0 flex items-center justify-center p-4">
            <motion.div key="cancel-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !isCancelling && setCancelConfirmId(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div key="cancel-modal" initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl z-10 p-6 text-center">
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-gray-800 mb-1">Hủy đơn hàng?</h3>
              <p className="text-gray-500 text-xs sm:text-sm mb-6 leading-relaxed">Bạn có chắc chắn muốn hủy đơn hàng này không? Hành động này không thể hoàn tác.</p>
              <div className="flex gap-3">
                <button onClick={() => setCancelConfirmId(null)} disabled={isCancelling} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors uppercase tracking-wider text-xs disabled:opacity-50">Không</button>
                <button onClick={executeCancelOrder} disabled={isCancelling} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors uppercase tracking-wider text-xs disabled:opacity-50 flex items-center justify-center gap-1.5">
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