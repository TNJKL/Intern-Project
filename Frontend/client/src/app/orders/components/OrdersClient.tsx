"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Package, Clock, CheckCircle2, Truck, Coffee, ArrowRight, X, MapPin, CreditCard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type OrderStatus = "pending" | "processing" | "delivering" | "completed" | "cancelled";

interface OrderItem {
  id: string;
  name: string;
  size: string;
  quantity: number;
  price: number;
  image: string;
}

interface Order {
  id: string;
  date: string;
  status: string;
  total: number;
  items: OrderItem[];
}

const ORDER_TABS = [
  { id: "active", label: "Đang giao" },
  { id: "history", label: "Lịch sử mua hàng" },
];

const getStatusDisplay = (status: string) => {
  switch (status) {
    case "pending": return { label: "Mới đặt", icon: Clock, color: "text-blue-500", bg: "bg-blue-50" };
    case "processing": return { label: "Đang pha chế", icon: Coffee, color: "text-orange-500", bg: "bg-orange-50" };
    case "delivering": return { label: "Đang giao hàng", icon: Truck, color: "text-primary", bg: "bg-primary/10" };
    case "completed": return { label: "Hoàn thành", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50" };
    case "cancelled": return { label: "Đã hủy", icon: Package, color: "text-red-500", bg: "bg-red-50" };
    default: return { label: "Không xác định", icon: Package, color: "text-gray-500", bg: "bg-gray-50" };
  }
};

const renderTimeline = (currentStatus: string) => {
  const steps = [
    { id: "pending", label: "Đã nhận đơn" },
    { id: "processing", label: "Đang pha chế" },
    { id: "delivering", label: "Đang giao" },
    { id: "completed", label: "Hoàn thành" },
  ];
  let currentStepIndex = steps.findIndex((s) => s.id === currentStatus);
  if (currentStepIndex === -1 && currentStatus !== "cancelled") currentStepIndex = 0;

  return (
    <div className="relative mt-6 mb-2">
      <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 rounded-full z-0" />
      <div
        className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 rounded-full z-0 transition-all duration-1000"
        style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
      />
      <div className="relative z-10 flex justify-between">
        {steps.map((step, index) => {
          const isCompleted = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;
          return (
            <div key={step.id} className="flex flex-col items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-500 ${isCompleted ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-white text-gray-300 border-2 border-gray-200"}`}>
                {isCompleted ? "✓" : index + 1}
              </div>
              <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${isCurrent ? "text-primary" : isCompleted ? "text-gray-600" : "text-gray-400"}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function OrdersClient({ orders }: { orders: Order[] }) {
  const [activeTab, setActiveTab] = useState("active");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filteredOrders = orders.filter((order) => {
    if (activeTab === "active") return ["pending", "processing", "delivering"].includes(order.status);
    return ["completed", "cancelled"].includes(order.status);
  });

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
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-sm font-bold uppercase tracking-widest rounded-xl transition-all ${activeTab === tab.id ? "bg-gray-800 text-white shadow-md" : "text-gray-500 hover:text-gray-800"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          <AnimatePresence mode="wait">
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
              filteredOrders.map((order) => {
                const StatusInfo = getStatusDisplay(order.status);
                const StatusIcon = StatusInfo.icon;
                return (
                  <motion.div key={order.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-6 shadow-sm border border-transparent hover:border-gray-100 transition-all">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-gray-100 pb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-black text-gray-800 text-lg">{order.id}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${StatusInfo.bg} ${StatusInfo.color}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {StatusInfo.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 font-medium">Đặt lúc: {order.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 font-bold uppercase mb-1">Tổng tiền</p>
                        <p className="text-xl font-black text-primary">{order.total.toLocaleString("vi-VN")}đ</p>
                      </div>
                    </div>

                    {activeTab === "active" && order.status !== "cancelled" && (
                      <div className="mb-8 px-2 md:px-8">{renderTimeline(order.status)}</div>
                    )}

                    <div className="space-y-4 mb-6 bg-gray-50 rounded-2xl p-4">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-white shrink-0 relative">
                            <Image src={item.image} alt={item.name} fill className="object-cover" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-800 text-sm">{item.name}</h4>
                            <p className="text-xs text-gray-500">Size: {item.size} • Số lượng: {item.quantity}</p>
                          </div>
                          <p className="font-bold text-gray-800 text-sm">{(item.price * item.quantity).toLocaleString("vi-VN")}đ</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end gap-3">
                      {order.status === "completed" && (
                        <button className="px-6 py-3 bg-primary/10 text-primary rounded-xl font-bold hover:bg-primary/20 transition-colors text-sm uppercase tracking-wider">
                          Đánh giá
                        </button>
                      )}
                      <button onClick={() => setSelectedOrder(order)} className="px-6 py-3 bg-gray-800 text-white rounded-xl font-bold hover:bg-black transition-colors text-sm uppercase tracking-wider flex items-center gap-2">
                        {order.status === "completed" || order.status === "cancelled" ? "Mua lại đơn này" : "Xem chi tiết"}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedOrder(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-white rounded-[32px] overflow-hidden shadow-2xl z-10 max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div>
                  <h3 className="text-xl font-black text-gray-800 uppercase">Chi Tiết Đơn Hàng</h3>
                  <p className="text-primary font-bold">{selectedOrder.id}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                <div className={`p-4 rounded-2xl flex items-center gap-4 ${getStatusDisplay(selectedOrder.status).bg}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-white ${getStatusDisplay(selectedOrder.status).color}`}>
                    {(() => { const Icon = getStatusDisplay(selectedOrder.status).icon; return <Icon className="w-6 h-6" />; })()}
                  </div>
                  <div>
                    <p className={`font-black uppercase text-sm ${getStatusDisplay(selectedOrder.status).color}`}>{getStatusDisplay(selectedOrder.status).label}</p>
                    <p className="text-xs text-gray-600 font-medium mt-1">Cập nhật lúc: {selectedOrder.date}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-gray-800 uppercase tracking-wider text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" /> Thông tin giao hàng
                  </h4>
                  <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                    <div><p className="text-xs text-gray-500 font-bold uppercase mb-1">Người nhận</p><p className="text-sm font-bold text-gray-800">Nguyễn Văn A - 0987654321</p></div>
                    <div><p className="text-xs text-gray-500 font-bold uppercase mb-1">Địa chỉ</p><p className="text-sm font-medium text-gray-800 leading-relaxed">Tòa nhà FPT, Khu CNC Hòa Lạc, Thạch Thất, Hà Nội</p></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-gray-800 uppercase tracking-wider text-sm flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-primary" /> Thanh toán
                  </h4>
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-sm font-bold text-gray-800">Thanh toán tiền mặt (COD)</p>
                    <p className="text-xs text-gray-500 mt-1">Sẽ thu tiền khi giao hàng</p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">Tổng cộng</p>
                  <p className="text-2xl font-black text-primary">{selectedOrder.total.toLocaleString("vi-VN")}đ</p>
                </div>
                {selectedOrder.status === "completed" && (
                  <button className="px-6 py-3 bg-gray-800 text-white rounded-xl font-bold hover:bg-black transition-colors uppercase tracking-widest text-sm">Mua lại</button>
                )}
                {selectedOrder.status !== "completed" && selectedOrder.status !== "cancelled" && (
                  <button className="px-6 py-3 bg-red-50 text-red-500 rounded-xl font-bold hover:bg-red-100 transition-colors uppercase tracking-widest text-sm">Hủy đơn</button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
