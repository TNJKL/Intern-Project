"use client";

import React from "react";
import { X, MapPin, Coffee, CreditCard, Loader2, Clock, CheckCircle2, Package, Truck, User, Phone, DollarSign, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { OrderDetail } from "@/services/order.service";
import { paymentService } from "@/services/payment.service";

interface OrderDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderDetail: OrderDetail | null;
    isLoading: boolean;
    isCancelling: boolean;
    onCancelOrder: (id: string) => void;
}

const getStatusDisplay = (status: string) => {
    const s = status?.toUpperCase();
    switch (s) {
        case "PENDING": return { label: "Chờ xử lý", icon: Clock, color: "text-blue-700", bg: "bg-blue-50 border-blue-200" };
        case "CONFIRMED": return { label: "Đã xác nhận", icon: CheckCircle2, color: "text-cyan-700", bg: "bg-cyan-50 border-cyan-200" };
        case "PREPARING": return { label: "Đang pha chế", icon: Coffee, color: "text-purple-700", bg: "bg-purple-50 border-purple-200" };
        case "READY": return { label: "Chờ giao", icon: Package, color: "text-orange-700", bg: "bg-orange-50 border-orange-200" };
        case "DELIVERING": return { label: "Đang giao hàng", icon: Truck, color: "text-[#5c3d2e]", bg: "bg-[#5c3d2e]/10 border-[#5c3d2e]/20" };
        case "COMPLETED": return { label: "Hoàn thành", icon: CheckCircle2, color: "text-green-700", bg: "bg-green-50 border-green-200" };
        case "CANCELLED": return { label: "Đã hủy", icon: X, color: "text-red-700", bg: "bg-red-50 border-red-200" };
        default: return { label: "Mới đặt", icon: Clock, color: "text-gray-700", bg: "bg-gray-50 border-gray-200" };
    }
};

export function OrderDetailModal({
    isOpen,
    onClose,
    orderDetail,
    isLoading,
    isCancelling,
    onCancelOrder,
}: OrderDetailModalProps) {
    if (!isOpen) return null;

    const [isRepaying, setIsRepaying] = React.useState(false);

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

    const canCancel = ["PENDING", "CONFIRMED"].includes(orderDetail?.status?.toUpperCase() || "");

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6">
            {/* Backdrop nền tối mờ siêu mịn */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/65 backdrop-blur-sm"
            />

            {/* Khung Form Chi Tiết Đơn Hàng (Max rộng 2xl thoáng đãng) */}
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 60 }}
                className="relative w-full max-w-2xl bg-white rounded-t-[32px] sm:rounded-[28px] overflow-hidden shadow-2xl z-10 max-h-[92vh] flex flex-col border border-gray-100"
            >
                {/* Tiêu đề Form - Chữ to, đậm đà */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#5c3d2e]/10 text-[#5c3d2e] rounded-xl flex items-center justify-center">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight">
                                Chi Tiết Đơn Hàng
                            </h3>
                            {orderDetail && (
                                <p className="text-xs text-gray-500 font-semibold mt-0.5 tracking-wide">
                                    ID Hệ thống: <span className="text-gray-700 select-all">{orderDetail.id}</span>
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-11 h-11 bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95 rounded-xl flex items-center justify-center transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Thân Form nội dung cuộn */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm scrollbar-none bg-white">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-24 text-gray-500">
                            <Loader2 className="w-12 h-12 animate-spin mb-4 text-[#5c3d2e]" />
                            <p className="text-base font-bold animate-pulse">Đang tải thông tin chi tiết đơn hàng...</p>
                        </div>
                    ) : orderDetail ? (
                        <>
                            {/* Banner cảnh báo VNPay chưa thanh toán xong */}
                            {orderDetail.status?.toUpperCase() === 'PENDING' && orderDetail.paymentMethod?.toUpperCase() === 'VNPAY' && (
                                <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                                    <div>
                                        <p className="font-bold text-sm">Đơn hàng chưa thanh toán xong!</p>
                                        <p className="text-xs text-amber-700 font-medium">Vui lòng thanh toán trong vòng 15 phút để tránh đơn hàng bị tự động hủy.</p>
                                    </div>
                                    <button
                                        onClick={handleRepay}
                                        disabled={isRepaying}
                                        className="bg-[#5c3d2e] text-white text-xs font-black uppercase px-4 py-2.5 rounded-xl hover:bg-[#4a3125] transition-all flex items-center gap-1.5 shrink-0 shadow-sm disabled:opacity-50"
                                    >
                                        {isRepaying && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                        Thanh toán ngay
                                    </button>
                                </div>
                            )}

                            {/* Khối hiển thị Tổng quan 2 Cột */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col justify-center bg-[#5c3d2e]/5 p-4 rounded-2xl border border-[#5c3d2e]/15">
                                    <span className="text-gray-600 font-extrabold text-xs uppercase tracking-wider mb-1">Mã đơn hàng</span>
                                    <span className="text-[#5c3d2e] font-black text-lg sm:text-xl tracking-wide select-all">
                                        {orderDetail.orderCode || orderDetail.id.slice(0, 8).toUpperCase()}
                                    </span>
                                </div>

                                <div className={`p-4 rounded-2xl border flex items-center gap-4 ${getStatusDisplay(orderDetail.status).bg}`}>
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white shrink-0 shadow-sm">
                                        {(() => {
                                            const Icon = getStatusDisplay(orderDetail.status).icon;
                                            return <Icon className={`w-6 h-6 ${getStatusDisplay(orderDetail.status).color}`} />;
                                        })()}
                                    </div>
                                    <div>
                                        <span className="text-gray-600 font-extrabold text-xs uppercase tracking-wider block mb-0.5">Trạng thái đơn</span>
                                        <p className={`font-black text-base uppercase tracking-tight ${getStatusDisplay(orderDetail.status).color}`}>
                                            {getStatusDisplay(orderDetail.status).label}
                                        </p>
                                        <p className="text-xs text-gray-600 font-medium mt-0.5">
                                            Cập nhật: {new Date(orderDetail.updatedAt || orderDetail.createdAt).toLocaleString("vi-VN")}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Thông tin giao nhận & Thanh toán */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                {/* Cột trái: Thông tin nhận hàng (Rõ ràng, Tương phản cao) */}
                                <div className="space-y-3 flex flex-col">
                                    <h4 className="font-black text-gray-900 uppercase tracking-wider text-xs flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-[#5c3d2e]" /> Thông tin nhận hàng
                                    </h4>
                                    <div className="bg-gray-50/80 rounded-2xl p-5 space-y-4 text-sm border border-gray-200/60 flex-1">
                                        <div>
                                            <p className="text-xs text-gray-500 font-black uppercase mb-1 flex items-center gap-1.5">
                                                <User className="w-3.5 h-3.5 text-gray-600" /> Người nhận
                                            </p>
                                            <p className="font-bold text-gray-900 text-base">
                                                {orderDetail.userName || "Khách hàng"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-black uppercase mb-1 flex items-center gap-1.5">
                                                <Phone className="w-3.5 h-3.5 text-gray-600" /> Số điện thoại
                                            </p>
                                            <p className="font-bold text-gray-900 text-base tracking-wide">
                                                {orderDetail.userPhone || "Không có số điện thoại"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-black uppercase mb-1 flex items-center gap-1.5">
                                                <MapPin className="w-3.5 h-3.5 text-gray-600" /> Địa chỉ giao hàng
                                            </p>
                                            <p className="font-semibold text-gray-800 text-sm leading-relaxed">
                                                {orderDetail.deliveryAddress || "Nhận trực tiếp tại cửa hàng"}
                                            </p>
                                        </div>
                                        {orderDetail.note && (
                                            <div className="pt-2 border-t border-gray-200/50">
                                                <p className="text-xs text-gray-500 font-black uppercase mb-1">Ghi chú từ khách</p>
                                                <p className="font-medium text-amber-900 bg-amber-50/80 border border-amber-100 px-3 py-2 rounded-xl italic text-sm">
                                                    “{orderDetail.note}”
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Cột phải: Chi tiết tài chính thanh toán */}
                                <div className="space-y-3 flex flex-col">
                                    <h4 className="font-black text-gray-900 uppercase tracking-wider text-xs flex items-center gap-2">
                                        <CreditCard className="w-4 h-4 text-[#5c3d2e]" /> Trạng thái & Giá trị đơn
                                    </h4>
                                    <div className="bg-gray-50/80 rounded-2xl p-5 flex flex-col justify-between text-sm border border-gray-200/60 flex-1 min-h-[180px]">
                                        <div>
                                            <p className="text-xs text-gray-500 font-black uppercase mb-1">Hình thức áp dụng</p>
                                            <p className="font-bold text-gray-900 text-sm bg-white border border-gray-200 px-3 py-2 rounded-xl shadow-xs inline-block w-full">
                                                {orderDetail.paymentMethod?.toLowerCase() === "cod"
                                                    ? "💵 Tiền mặt khi nhận hàng (COD)"
                                                    : `💳 Chuyển khoản (${orderDetail.paymentMethod || "N/A"})`}
                                            </p>
                                        </div>
                                        <div className="mt-6 pt-4 border-t border-gray-200 space-y-2.5">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-600 font-medium">Giá tạm tính</span>
                                                <span className="font-bold text-gray-900 text-base">
                                                    {(orderDetail.subtotal ?? orderDetail.totalAmount).toLocaleString("vi-VN")}đ
                                                </span>
                                            </div>
                                            {(orderDetail.discountAmount ?? 0) > 0 && (
                                                <div className="flex justify-between items-center text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded-xl border border-green-100 font-bold">
                                                    <span>Khuyến mãi giảm giá</span>
                                                    <span>-{(orderDetail.discountAmount ?? 0).toLocaleString("vi-VN")}đ</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Danh sách món ăn / đồ uống */}
                            <div className="space-y-3">
                                <h4 className="font-black text-gray-900 uppercase tracking-wider text-xs flex items-center gap-2">
                                    <Coffee className="w-4 h-4 text-[#5c3d2e]" /> Danh sách món ăn / đồ uống đã đặt
                                </h4>
                                <div className="bg-gray-50/80 rounded-2xl p-5 space-y-4 border border-gray-200/60">
                                    {orderDetail.items && orderDetail.items.length > 0 ? (
                                        orderDetail.items.map((item, idx) => (
                                            <div key={item.id || idx} className="flex justify-between items-center border-b border-gray-200/60 pb-4 last:border-0 last:pb-0 gap-4">
                                                <div className="flex-1 space-y-1">
                                                    <p className="font-bold text-gray-900 text-base">
                                                        <span className="text-[#5c3d2e] font-black text-lg mr-2 bg-[#5c3d2e]/10 px-2 py-0.5 rounded-lg inline-block">
                                                            {item.quantity}x
                                                        </span>
                                                        {item.productName}
                                                    </p>
                                                    {item.variantLabel && (
                                                        <p className="text-xs text-gray-600 font-semibold pl-10">
                                                            Kích cỡ: <span className="text-gray-900 font-bold bg-white px-2 py-0.5 border border-gray-200 rounded-md">Size {item.variantLabel}</span>
                                                        </p>
                                                    )}
                                                    {item.toppings && item.toppings.length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5 pt-1 pl-10">
                                                            {item.toppings.map((t, idxTopping) => (
                                                                <span key={idxTopping} className="text-xs px-2.5 py-0.5 bg-amber-50 text-amber-900 font-semibold rounded-lg border border-amber-200">
                                                                    + {t.name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="font-black text-gray-900 text-base shrink-0 bg-white px-3 py-1 border border-gray-200/80 rounded-xl shadow-xs">
                                                    {(item.subtotal ?? 0).toLocaleString("vi-VN")}đ
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500 italic text-center py-4">Không tìm thấy thông tin sản phẩm.</p>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-red-500">
                            <p className="text-base font-black">Xảy ra lỗi bất ngờ: Không thể đọc dữ liệu phản hồi.</p>
                        </div>
                    )}
                </div>

                {/* Chân Form chứa Tổng tiền siêu to khổng lồ và Nút hành động */}
                {orderDetail && (
                    <div className="p-6 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shrink-0 pb-8 sm:pb-6">
                        <div className="flex justify-between sm:flex-col items-center sm:items-start bg-white sm:bg-transparent p-3 sm:p-0 rounded-2xl border sm:border-0 border-gray-200">
                            <p className="text-xs font-black text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                <DollarSign className="w-3.5 h-3.5 text-gray-600" /> Tổng thanh toán
                            </p>
                            <p className="text-2xl sm:text-3xl font-black text-[#5c3d2e] tracking-tight">
                                {orderDetail.totalAmount?.toLocaleString("vi-VN") ?? 0}đ
                            </p>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            {orderDetail.status?.toUpperCase() === "COMPLETED" && (
                                <button className="flex-1 sm:flex-initial px-6 py-3.5 bg-[#5c3d2e] text-white rounded-xl font-bold hover:bg-[#4a3125] active:scale-98 transition-all uppercase tracking-wider text-sm shadow-md">
                                    Mua lại đơn này
                                </button>
                            )}

                            {canCancel && (
                                <button
                                    onClick={() => onCancelOrder(orderDetail.id)}
                                    disabled={isCancelling}
                                    className="flex-1 sm:flex-initial px-6 py-3.5 bg-red-50 text-red-700 rounded-xl font-bold hover:bg-red-100 active:scale-98 transition-all uppercase tracking-wider text-sm disabled:opacity-50 flex items-center justify-center gap-2 border border-red-200"
                                >
                                    {isCancelling && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Hủy đơn hàng
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}