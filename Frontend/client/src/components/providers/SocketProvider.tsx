"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { paymentService } from "../../services/payment.service";
import { apiClient } from "@/lib/api";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinGuestRoom: (guestSessionId: string) => void;
  pendingPayment: { orderId: string; orderCode: string; amount: number; totalPendingCount: number } | null;
  setPendingPayment: (payment: { orderId: string; orderCode: string; amount: number; totalPendingCount: number } | null) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  joinGuestRoom: () => { },
  pendingPayment: null,
  setPendingPayment: () => { },
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { data: session, status, update } = useSession();
  const accessToken = session?.accessToken || null;
  const isAuthChecked = status !== "loading";
  const [reconnectTrigger, setReconnectTrigger] = useState(0);
  const router = useRouter();
  const [pendingPayment, setPendingPaymentState] = useState<{ orderId: string; orderCode: string; amount: number; totalPendingCount: number } | null>(null);
  const pendingPaymentRef = useRef<{ orderId: string; orderCode: string; amount: number; totalPendingCount: number } | null>(null);
  const hasInteractedRef = useRef(false);

  useEffect(() => {
    pendingPaymentRef.current = pendingPayment;
  }, [pendingPayment]);

  const setPendingPayment = (val: { orderId: string; orderCode: string; amount: number; totalPendingCount: number } | null) => {
    setPendingPaymentState(val);
    if (!val) {
      hasInteractedRef.current = true;
    }
  };

  // 2. Quản lý vòng đời kết nối dựa trên trạng thái xác thực ĐÚNG THỜI ĐIỂM
  useEffect(() => {
    // Chỉ chạy khi đã kiểm tra xong trạng thái token trong ứng dụng
    if (!isAuthChecked) return;

    let paymentAlertTimeout: NodeJS.Timeout | null = null;
    let alertInterval: NodeJS.Timeout | null = null;

    const backendIp = process.env.NEXT_PUBLIC_GLOBAL_BACKEND_IP || "http://localhost:80";
    const guestSessionId = localStorage.getItem("guestSessionId");

    // CHIẾN LƯỢC: Nếu không có cả accessToken (User) và guestSessionId (Guest) thì không kết nối để tránh lỗi lãng phí
    if (!accessToken && !guestSessionId) {
      console.log("[Socket.IO] Không tìm thấy danh tính User hoặc Guest cũ, tạm dừng kết nối.");
      return;
    }

    console.log("[Socket.IO] Khởi tạo đường truyền với cấu hình an toàn...");

    const socket = io(`${backendIp}/notifications`, {
      path: "/ws",
      transports: ["websocket", "polling"],
      autoConnect: false,
      // Nạp thẳng token vào handshake nếu có, phòng tránh lỗi 'No token provided'
      auth: accessToken ? { token: accessToken } : {},
    });

    socketRef.current = socket;

    // ─── Sự kiện: connect ───
    socket.on("connect", () => {
      console.log("[Socket.IO] Connected thành công với ID:", socket.id);
      setIsConnected(true);

      if (accessToken) {
        console.log("[Socket.IO] Gửi yêu cầu join phòng Thành viên");
        socket.emit("join", {});
      } else {
        const activeGuestId = localStorage.getItem("guestSessionId");
        if (activeGuestId) {
          console.log("[Socket.IO] Gửi yêu cầu tái kết nối phòng Guest:", activeGuestId);
          socket.emit("join-guest", { guestSessionId: activeGuestId });
        }
      }
    });

    // ─── Sự kiện: joined (User thành công) ───
    socket.on("joined", (data: { room: string; success: boolean } | null) => {
      console.log("[Socket.IO] Xác nhận vào phòng User:", data?.room);
    });

    // ─── Sự kiện: joined-guest (Guest thành công) ───
    socket.on("joined-guest", (data: { room: string; orderCode: string; success: boolean } | null) => {
      console.log("[Socket.IO] Xác nhận vào phòng Guest:", data?.room);
    });

    // ─── Sự kiện: notification ───
    socket.on("notification", (payload: any) => {
      console.log("[Socket.IO] Nhận thông báo:", payload);

      const notifData = payload?.data ?? payload;
      const title = notifData?.title || "Thông báo từ cửa hàng";
      const body = notifData?.body || "Đơn hàng của bạn vừa có cập nhật mới.";

      toast.success(
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-sm text-gray-900">{title}</span>
          <span className="text-xs text-gray-600">{body}</span>
        </div>,
        { duration: 6000, position: "top-right" }
      );

      // Đồng bộ hóa tức thì cho các Server Components (Dành cho luồng User)
      router.refresh();

      const innerData = notifData?.data || notifData;
      const notifOrderCode = innerData?.orderCode || payload?.orderCode || notifData?.orderCode;
      const notifStatus = innerData?.currentStatus || innerData?.status || payload?.status;

      // Xử lý đồng bộ realtime trạng thái đơn hàng khi nhận được bất kỳ cập nhật nào liên quan đến đơn hàng
      if (notifOrderCode) {
        const guestSessionId = localStorage.getItem("guestSessionId");
        socket.emit("check-pending-repayment", { guestSessionId });
      }

      // Đồng bộ hóa giao diện Client (Dành cho luồng Guest tra cứu)
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("order-status-updated", {
            detail: {
              orderCode: notifOrderCode,
              status: notifStatus
            },
          })
        );
      }
    });

    // ─── Sự kiện: exception (Lỗi phân quyền hệ thống) ───
    socket.on("exception", async (error: any) => {
      if (error) {
        const errMsg = error?.message || error;
        
        if (errMsg === "Unauthorized: Invalid token" || errMsg.includes("Unauthorized")) {
          console.warn("[Socket.IO] Token hết hạn/không hợp lệ. Đang tự động làm mới token và tái kết nối...");
          try {
            // Gọi thử một API qua apiClient để kích hoạt Axios interceptor làm mới token nếu cần
            await apiClient.get("/users/me").catch(() => {});
            
            // Cập nhật lại NextAuth session
            if (typeof update === "function") {
              await update();
            }
          } catch (syncErr) {
            console.error("[Socket.IO] Lỗi khi đồng bộ token cho socket:", syncErr);
          }
        }
      }
    });

    // ─── Sự kiện: error ───
    socket.on("error", (error: any) => {
      if (error?.message === "Invalid or expired guest session") {
        console.warn("[Socket.IO] Phiên guest hết hạn.");
        localStorage.removeItem("guestSessionId");
        localStorage.removeItem("guestOrderCode");
      } else {
        console.error("[Socket.IO] Lỗi hệ thống:", error);
      }
    });

    // ─── Sự kiện: pending-payment-alert ───
    socket.on("pending-payment-alert", (data: { orderId: string; orderCode: string; amount: number; totalPendingCount?: number } | null) => {
      console.log("[Socket.IO] Nhận cảnh báo thanh toán pending:", data);
      
      if (!data) {
        setPendingPaymentState(null);
        if (alertInterval) clearInterval(alertInterval);
        if (paymentAlertTimeout) clearTimeout(paymentAlertTimeout);
        toast.dismiss("pending-payment");
        return;
      }

      // Nếu là đơn hàng chưa thanh toán khác với đơn hàng đang lưu, reset trạng thái tương tác để Toast mới hiển thị
      const currentPending = pendingPaymentRef.current;
      if (!currentPending || currentPending.orderId !== data.orderId) {
        hasInteractedRef.current = false;
        if (alertInterval) clearInterval(alertInterval);
        if (paymentAlertTimeout) clearTimeout(paymentAlertTimeout);
        paymentAlertTimeout = null;
        alertInterval = null;
      }

      const totalPendingCount = data.totalPendingCount || 1;
      setPendingPaymentState({
        orderId: data.orderId,
        orderCode: data.orderCode,
        amount: data.amount,
        totalPendingCount: totalPendingCount
      });

      if (hasInteractedRef.current) {
        return;
      }

      const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(value);
      };

      const showToast = () => {
        if (hasInteractedRef.current) return;
        toast.custom(
          (t) => (
            <div
              className={`${
                t.visible ? "animate-enter" : "animate-leave"
              } max-w-sm w-full bg-white/95 backdrop-blur-md shadow-xl rounded-lg border border-amber-200/50 pointer-events-auto p-4 flex flex-col gap-3.5 transition-all duration-300 relative`}
            >
              {/* Nút X đóng ở góc trên bên phải */}
              <button
                onClick={() => {
                  hasInteractedRef.current = true;
                  if (alertInterval) clearInterval(alertInterval);
                  if (paymentAlertTimeout) clearTimeout(paymentAlertTimeout);
                  toast.dismiss("pending-payment");
                }}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors"
                title="Đóng thông báo"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex items-start gap-3.5 pr-6">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500 border border-amber-100">
                    <svg
                      className="h-5 w-5 animate-pulse"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-gray-900 leading-tight">
                    Đơn hàng chưa thanh toán!
                  </h4>
                  <p className="mt-1 text-xs text-gray-500 leading-relaxed">
                    Bạn có đơn hàng <span className="font-mono font-bold text-amber-700 bg-amber-50/50 px-1.5 py-0.5 rounded border border-amber-100">{data.orderCode}</span> chưa hoàn tất thanh toán.
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Số tiền: <span className="text-amber-600 font-bold">{formatCurrency(data.amount)}</span>
                  </p>
                </div>
              </div>

              {/* Hàng nút bấm chia đều 2 bên cân đối */}
              <div className="grid grid-cols-2 gap-2 mt-1 pt-2.5 border-t border-gray-100">
                <button
                  onClick={() => {
                    hasInteractedRef.current = true;
                    if (alertInterval) clearInterval(alertInterval);
                    if (paymentAlertTimeout) clearTimeout(paymentAlertTimeout);
                    toast.dismiss("pending-payment");
                  }}
                  className="w-full py-2 rounded-md text-xs font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 border border-gray-200/60 transition-colors duration-150"
                >
                  Bỏ qua
                </button>
                <button
                  onClick={async () => {
                    hasInteractedRef.current = true;
                    if (alertInterval) clearInterval(alertInterval);
                    if (paymentAlertTimeout) clearTimeout(paymentAlertTimeout);
                    toast.dismiss("pending-payment");
                    try {
                      toast.loading("Đang chuẩn bị link thanh toán...", { id: "payment-redirect" });
                      const res = await paymentService.getPaymentUrl(data.orderId);
                      if (res?.success && res?.data?.paymentUrl) {
                        toast.success("Đang chuyển hướng đến VNPAY...", { id: "payment-redirect" });
                        window.location.href = res.data.paymentUrl;
                      } else {
                        toast.error("Không thể tạo link thanh toán mới. " + (res?.message || ""), { id: "payment-redirect" });
                      }
                    } catch (error: any) {
                      console.error("Lỗi khi thanh toán lại:", error);
                      toast.error(
                        error?.response?.data?.message || error?.message || "Lỗi kết nối khi thanh toán lại",
                        { id: "payment-redirect" }
                      );
                    }
                  }}
                  className="w-full py-2 rounded-md text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm hover:shadow transition-all duration-150"
                >
                  Thanh toán ngay
                </button>
              </div>
            </div>
          ),
          { id: "pending-payment", duration: 3000, position: "top-right" }
        );
      };

      if (!paymentAlertTimeout && !alertInterval) {
        // Hiển thị lượt đầu tiên sau 1.2 giây
        paymentAlertTimeout = setTimeout(() => {
          showToast();
        }, 1200);

        // Định kỳ xuất hiện lại mỗi 6 giây (hiển thị 3 giây, tắt đi 3 giây rồi nhảy lại)
        alertInterval = setInterval(() => {
          if (hasInteractedRef.current) {
            if (alertInterval) clearInterval(alertInterval);
            return;
          }
          // Ẩn toast cũ đi
          toast.dismiss("pending-payment");
          // Chờ hiệu ứng leave chạy xong (300ms) rồi nhảy tiếp toast mới
          setTimeout(() => {
            if (!hasInteractedRef.current) {
              showToast();
            }
          }, 300);
        }, 6000);
      }
    });

    // ─── Sự kiện: disconnect ───
    socket.on("disconnect", (reason) => {
      console.log("[Socket.IO] Disconnected:", reason);
      setIsConnected(false);
    });

    // Thực hiện lệnh kết nối thực tế
    socket.connect();

    return () => {
      if (paymentAlertTimeout) {
        clearTimeout(paymentAlertTimeout);
      }
      if (alertInterval) {
        clearInterval(alertInterval);
      }
      if (socketRef.current) {
        socketRef.current.emit("leave", {});
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [accessToken, isAuthChecked, reconnectTrigger]);

  /**
   * Gọi hàm này khi Guest đặt hàng hoặc tra cứu thành công đơn hàng vãng lai
   */
  const joinGuestRoom = (guestSessionId: string) => {
    localStorage.setItem("guestSessionId", guestSessionId);

    if (socketRef.current && socketRef.current.connected) {
      console.log("[Socket.IO] Đang kết nối, emit join-guest ngay lập tức:", guestSessionId);
      socketRef.current.emit("join-guest", { guestSessionId });
    } else {
      console.log("[Socket.IO] Chưa có kết nối hoặc socket cũ đóng, chuẩn bị tái thiết lập...");
      setReconnectTrigger((prev) => prev + 1);
    }
  };

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected, joinGuestRoom, pendingPayment, setPendingPayment }}>
      {children}
    </SocketContext.Provider>
  );
};