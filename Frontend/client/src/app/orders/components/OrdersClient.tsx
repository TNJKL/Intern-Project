"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Package, Clock, CheckCircle2, Truck, Coffee, ArrowRight, X, MapPin, CreditCard, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { orderService, OrderDetail } from "@/services/order.service";

type OrderStatus = "PENDING" | "DELIVERING" | "COMPLETED" | "CANCELLED" | string;

interface OrderSummary {
  id: string;
  orderCode: string;
  status: string;
  totalAmount: number;
  createdAt: string;
}

const ORDER_TABS = [
  { id: "active", label: "Đang giao" },
  { id: "history", label: "Lịch sử mua hàng" },
];

const getStatusDisplay = (status: string) => {
  const s = status?.toUpperCase();
  switch (s) {
    case "PENDING": return { label: "Chờ xử lý", icon: Clock, color: "text-blue-500", bg: "bg-blue-50" };
    case "CONFIRMED": return { label: "Đã xác nhận", icon: CheckCircle2, color: "text-cyan-500", bg: "bg-cyan-50" };
    case "PREPARING": return { label: "Đang pha chế", icon: Coffee, color: "text-purple-500", bg: "bg-purple-50" };
    case "READY": return { label: "Chờ giao", icon: Package, color: "text-orange-500", bg: "bg-orange-50" };
    case "DELIVERING": return { label: "Đang giao hàng", icon: Truck, color: "text-primary", bg: "bg-primary/10" };
    case "COMPLETED": return { label: "Hoàn thành", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50" };
    case "CANCELLED": return { label: "Đã hủy", icon: Package, color: "text-red-500", bg: "bg-red-50" };
    default: return { label: "Mới đặt", icon: Clock, color: "text-gray-500", bg: "bg-gray-50" };
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
    <div className="relative mt-4 mb-1">
      <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 rounded-full z-0" />
      <div
        className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 rounded-full z-0 transition-all duration-1000"
        style={{ width: `${Math.max(0, (currentStepIndex / (steps.length - 1)) * 100)}%` }}
      />
      <div className="relative z-10 flex justify-between">
        {steps.map((step, index) => {
          const isCompleted = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;
          return (
            <div key={step.id} className="flex flex-col items-center gap-1.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors duration-500 ${isCompleted ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-white text-gray-300 border border-gray-200"}`}>
                {isCompleted ? "✓" : index + 1}
              </div>
              <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${isCurrent ? "text-primary" : isCompleted ? "text-gray-500" : "text-gray-400"}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function OrdersClient({ orders }: { orders: OrderSummary[] }) {
  const [activeTab, setActiveTab] = useState("active");
  const [currentPage, setCurrentPage] = useState(1);

  const router = useRouter();

  // States for API Order Details
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // State for Custom Confirmation Modal
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);

  // Filter orders list statuses
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
      const res = await orderService.getOrderById(id);
      if (res.success) {
        setOrderDetail(res.data);
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
        // Refresh the detail modal if it's the one being cancelled
        if (isModalOpen && orderDetail?.id === cancelConfirmId) {
          const detailRes = await orderService.getOrderById(cancelConfirmId);
          if (detailRes.success) setOrderDetail(detailRes.data);
        }

        // Close confirm modal and refresh the main page to update the list
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

  return (
    <div className="min-h-screen bg-[#fcf9f2] pb-32">
      <div className="max-w-4xl mx-auto px-6 pt-8 pb-12">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tight">Đơn hàng của bạn</h1>
        </div>

        <div className="flex bg-white p-1 rounded-2xl shadow-sm mb-8">
          {ORDER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 py-3 text-sm font-bold uppercase tracking-widest rounded-xl transition-all ${activeTab === tab.id ? "bg-[#4d362b] text-white shadow-md shadow-[#4d362b]/20" : "text-gray-500 hover:text-[#4d362b]"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          <AnimatePresence>
            {filteredOrders.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-white rounded-3xl p-12 text-center shadow-sm flex flex-col items-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Package className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Chưa có đơn hàng nào</h3>
                <p className="text-gray-500 mb-6 text-sm">Bạn chưa có đơn hàng nào trong mục này.</p>
                <Link href="/menu" className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-coffee-dark transition-colors uppercase tracking-widest text-sm">
                  Khám phá Menu
                </Link>
              </motion.div>
            ) : (
              paginatedOrders.map((order) => {
                const StatusInfo = getStatusDisplay(order.status);
                const StatusIcon = StatusInfo.icon;
                return (
                  <motion.div key={order.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-3.5 sm:p-4 shadow-sm border border-transparent hover:border-gray-100 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 border-b border-gray-100 pb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-extrabold text-gray-800 text-base sm:text-lg">{order.orderCode || order.id}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-bold flex items-center gap-1 ${StatusInfo.bg} ${StatusInfo.color}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {StatusInfo.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">Đặt lúc: {new Date(order.createdAt).toLocaleString('vi-VN')}</p>
                      </div>
                      <div className="sm:text-right flex sm:flex-col justify-between sm:justify-start items-center sm:items-end gap-1 sm:gap-0 mt-2 sm:mt-0">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Tổng tiền</p>
                        <p className="text-lg sm:text-xl font-black text-primary">{order.totalAmount?.toLocaleString("vi-VN") ?? 0}đ</p>
                      </div>
                    </div>

                    {activeTab === "active" && order.status?.toLowerCase() !== "cancelled" && (
                      <div className="mb-4 px-1 sm:px-6">{renderTimeline(order.status)}</div>
                    )}

                    <div className="flex justify-end gap-2">
                      {order.status?.toLowerCase() === "completed" && (
                        <button className="px-4 py-2 bg-[#4d362b]/5 text-[#4d362b] rounded-xl font-extrabold hover:bg-[#4d362b]/10 transition-colors text-xs uppercase tracking-wider">
                          Đánh giá
                        </button>
                      )}
                      <button onClick={() => handleViewDetail(order.id)} className="px-4 py-2.5 bg-[#4d362b] text-white rounded-xl font-extrabold hover:bg-[#3c2a21] transition-colors text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                        {order.status?.toLowerCase() === "completed" || order.status?.toLowerCase() === "cancelled" ? "Mua lại đơn này" : "Xem chi tiết"}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 bg-white p-4 rounded-2xl shadow-sm border border-gray-100/80">
              <span className="text-xs sm:text-sm font-medium text-[#8c7a6b]">
                Hiển thị đơn hàng <strong className="text-[#4d362b] font-black">{filteredOrders.length > 0 ? (adjustedPage - 1) * itemsPerPage + 1 : 0} - {Math.min(adjustedPage * itemsPerPage, filteredOrders.length)}</strong> trong tổng số <strong className="text-[#4d362b] font-black">{filteredOrders.length}</strong> đơn
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={adjustedPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="px-3 py-2 bg-gray-50 text-[#4d362b] rounded-xl font-bold hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-gray-50 transition-all text-xs flex items-center gap-1 border border-gray-200/50"
                >
                  <ChevronLeft className="w-4 h-4" /> Trước
                </button>
                <div className="flex items-center gap-1 overflow-x-auto px-1">
                  {(() => {
                    const pageNumbers = [];
                    const maxVisible = 5;
                    let start = Math.max(1, adjustedPage - 2);
                    let end = Math.min(totalPages, start + maxVisible - 1);
                    if (end - start < maxVisible - 1) {
                      start = Math.max(1, end - maxVisible + 1);
                    }
                    for (let i = start; i <= end; i++) {
                      pageNumbers.push(i);
                    }
                    return (
                      <>
                        {start > 1 && (
                          <>
                            <button onClick={() => setCurrentPage(1)} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-extrabold transition-all ${adjustedPage === 1 ? "bg-[#4d362b] text-white shadow-sm shadow-[#4d362b]/20" : "text-gray-500 hover:bg-gray-50 hover:text-[#4d362b]"}`}>1</button>
                            {start > 2 && <span className="text-gray-400 text-xs px-0.5">...</span>}
                          </>
                        )}
                        {pageNumbers.map(page => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-extrabold transition-all ${adjustedPage === page ? "bg-[#4d362b] text-white shadow-sm shadow-[#4d362b]/20" : "text-gray-500 hover:bg-gray-50 hover:text-[#4d362b]"}`}
                          >
                            {page}
                          </button>
                        ))}
                        {end < totalPages && (
                          <>
                            {end < totalPages - 1 && <span className="text-gray-400 text-xs px-0.5">...</span>}
                            <button onClick={() => setCurrentPage(totalPages)} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-extrabold transition-all ${adjustedPage === totalPages ? "bg-[#4d362b] text-white shadow-sm shadow-[#4d362b]/20" : "text-gray-500 hover:bg-gray-50 hover:text-[#4d362b]"}`}>{totalPages}</button>
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>
                <button
                  disabled={adjustedPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="px-3 py-2 bg-gray-50 text-[#4d362b] rounded-xl font-bold hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-gray-50 transition-all text-xs flex items-center gap-1 border border-gray-200/50"
                >
                  Sau <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order Detail Modal connected to API */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-white rounded-[32px] overflow-hidden shadow-2xl z-10 max-h-[90vh] flex flex-col">

              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div>
                  <h3 className="text-xl font-black text-gray-800 uppercase">Chi Tiết Đơn Hàng</h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 flex-1 min-h-[300px]">
                {isLoadingDetail ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
                    <p className="text-sm font-bold">Đang tải dữ liệu...</p>
                  </div>
                ) : orderDetail ? (
                  <>
                    <p className="text-primary font-bold text-lg mb-4">{orderDetail.orderCode}</p>
                    <div className={`p-4 rounded-2xl flex items-center gap-4 ${getStatusDisplay(orderDetail.status).bg}`}>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-white ${getStatusDisplay(orderDetail.status).color}`}>
                        {(() => { const Icon = getStatusDisplay(orderDetail.status).icon; return <Icon className="w-6 h-6" />; })()}
                      </div>
                      <div>
                        <p className={`font-black uppercase text-sm ${getStatusDisplay(orderDetail.status).color}`}>{getStatusDisplay(orderDetail.status).label}</p>
                        <p className="text-xs text-gray-600 font-medium mt-1">Cập nhật lúc: {new Date(orderDetail.updatedAt || orderDetail.createdAt).toLocaleString('vi-VN')}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-bold text-gray-800 uppercase tracking-wider text-sm flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" /> Thông tin giao hàng
                      </h4>
                      <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                        <div>
                          <p className="text-xs text-gray-500 font-bold uppercase mb-1">Người nhận</p>
                          <p className="text-sm font-bold text-gray-800">{orderDetail.userName || "Khách"} - {orderDetail.userPhone}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-bold uppercase mb-1">Địa chỉ</p>
                          <p className="text-sm font-medium text-gray-800 leading-relaxed">{orderDetail.deliveryAddress}</p>
                        </div>
                        {orderDetail.note && (
                          <div>
                            <p className="text-xs text-gray-500 font-bold uppercase mb-1">Ghi chú</p>
                            <p className="text-sm font-medium text-gray-800 leading-relaxed">{orderDetail.note}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-bold text-gray-800 uppercase tracking-wider text-sm flex items-center gap-2">
                        <Coffee className="w-4 h-4 text-primary" /> Sản phẩm đã đặt
                      </h4>
                      <div className="bg-gray-50 rounded-2xl p-4 space-y-4">
                        {orderDetail.items.map((item) => (
                          <div key={item.id} className="flex justify-between items-start border-b border-gray-200 pb-3 last:border-0 last:pb-0">
                            <div>
                              <p className="font-bold text-gray-800 text-sm">{item.quantity}x {item.productName}</p>
                              <p className="text-xs text-gray-500 mt-0.5">Size {item.variantLabel}</p>
                              {item.toppings && item.toppings.length > 0 && (
                                <p className="text-[10px] text-gray-400 mt-1">+ {item.toppings.map(t => t.name).join(", ")}</p>
                              )}
                            </div>
                            <p className="font-bold text-gray-800 text-sm">{item.subtotal?.toLocaleString("vi-VN") ?? 0}đ</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-bold text-gray-800 uppercase tracking-wider text-sm flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-primary" /> Thanh toán
                      </h4>
                      <div className="bg-gray-50 rounded-2xl p-4">
                        <p className="text-sm font-bold text-gray-800">{orderDetail.paymentMethod === 'cod' ? 'Thanh toán tiền mặt (COD)' : orderDetail.paymentMethod}</p>

                        <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Tạm tính</span>
                            <span className="font-bold text-gray-800">{orderDetail.subtotal?.toLocaleString()}đ</span>
                          </div>
                          {orderDetail.discountAmount > 0 && (
                            <div className="flex justify-between text-sm text-green-600">
                              <span>Giảm giá</span>
                              <span className="font-bold">-{orderDetail.discountAmount?.toLocaleString() ?? 0}đ</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-red-400">
                    <p className="text-sm font-bold">Không thể tải thông tin đơn hàng</p>
                  </div>
                )}
              </div>

              {orderDetail && (
                <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Tổng thanh toán</p>
                    <p className="text-2xl font-black text-primary">{orderDetail.totalAmount?.toLocaleString("vi-VN") ?? 0}đ</p>
                  </div>
                  {orderDetail.status?.toUpperCase() === "COMPLETED" && (
                    <button className="px-6 py-3 bg-[#4d362b] text-white rounded-xl font-bold hover:bg-[#3c2a21] transition-colors uppercase tracking-widest text-sm shadow-sm">Mua lại</button>
                  )}
                  {orderDetail.status?.toUpperCase() === "PENDING" && (
                    <button
                      onClick={() => handleCancelOrder(orderDetail.id)}
                      disabled={isCancelling}
                      className="px-6 py-3 bg-red-50 text-red-500 rounded-xl font-bold hover:bg-red-100 transition-colors uppercase tracking-widest text-sm disabled:opacity-50 flex items-center gap-2"
                    >
                      {isCancelling && <Loader2 className="w-4 h-4 animate-spin" />}
                      Hủy đơn
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Confirmation Modal for Cancellation */}
      <AnimatePresence>
        {cancelConfirmId && (
          <div style={{ zIndex: 9999 }} className="fixed inset-0 flex items-center justify-center p-4">
            <motion.div
              key="cancel-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isCancelling && setCancelConfirmId(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              key="cancel-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl z-10 p-6 text-center"
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-black text-gray-800 mb-2">Hủy đơn hàng?</h3>
              <p className="text-gray-500 text-sm mb-8">Bạn có chắc chắn muốn hủy đơn hàng này không? Hành động này không thể hoàn tác.</p>

              <div className="flex gap-3">
                <button
                  onClick={() => setCancelConfirmId(null)}
                  disabled={isCancelling}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors uppercase tracking-widest text-sm disabled:opacity-50"
                >
                  Không
                </button>
                <button
                  onClick={executeCancelOrder}
                  disabled={isCancelling}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors uppercase tracking-widest text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isCancelling && <Loader2 className="w-4 h-4 animate-spin" />}
                  Đồng ý
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
