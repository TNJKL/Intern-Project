"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinGuestRoom: (guestSessionId: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  joinGuestRoom: () => { },
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

  // 2. Quản lý vòng đời kết nối dựa trên trạng thái xác thực ĐÚNG THỜI ĐIỂM
  useEffect(() => {
    // Chỉ chạy khi đã kiểm tra xong trạng thái token trong ứng dụng
    if (!isAuthChecked) return;

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

      // Đồng bộ hóa giao diện Client (Dành cho cả luồng Guest tra cứu và User đã đăng nhập)
      if (typeof window !== "undefined") {
        const innerData = notifData?.data || notifData;
        window.dispatchEvent(
          new CustomEvent("order-status-updated", {
            detail: {
              orderCode: innerData?.orderCode || payload?.orderCode || notifData?.orderCode,
              status: innerData?.currentStatus || innerData?.status || payload?.status || notifData?.status
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
            await apiClient.get("/auth/me").catch(() => {});
            
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

    // ─── Sự kiện: disconnect ───
    socket.on("disconnect", (reason) => {
      console.log("[Socket.IO] Disconnected:", reason);
      setIsConnected(false);
    });

    // Thực hiện lệnh kết nối thực tế
    socket.connect();

    return () => {
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
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected, joinGuestRoom }}>
      {children}
    </SocketContext.Provider>
  );
};