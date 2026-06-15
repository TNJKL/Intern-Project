import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/zustand/useAuthStore";
import { useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import { apiClient } from "@/lib/api";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  const { notification } = App.useApp();

  // ─── Bootstrap socket connection ───
  useEffect(() => {
    const backendIp =
      import.meta.env.VITE_GLOBAL_BACKEND_IP || "http://localhost:80";

    const socket = io(`${backendIp}/notifications`, {
      path: "/ws",
      transports: ["websocket", "polling"], // websocket ưu tiên, polling dự phòng
      autoConnect: false,
      auth: accessToken ? { token: accessToken } : {},
    });

    socketRef.current = socket;

    // ─── connect ───
    socket.on("connect", () => {
      console.log("[Socket.IO] Admin connected:", socket.id);
      setIsConnected(true);

      if (accessToken) {
        // Luồng user đã đăng nhập: join không cần payload
        socket.emit("join", {});
      }
    });

    // ─── joined ───
    socket.on("joined", (data: { room: string; success: boolean } | null) => {
      console.log("[Socket.IO] Admin joined room:", data?.room);
    });

    // ─── admin:alerts (Low stock warnings) ───
    socket.on("admin:alerts", (payload: any) => {
      console.log("[Socket.IO] Admin stock alert received:", payload);
      const title = payload?.title || "[Kho] Cảnh báo tồn kho";
      const body = payload?.body || "Nguyên liệu kho sắp hết.";
      const level = payload?.data?.alertLevel;

      if (level === "OUT_OF_STOCK") {
        notification.error({
          message: title,
          description: body,
          placement: "topRight",
          duration: 8,
        });
      } else {
        notification.warning({
          message: title,
          description: body,
          placement: "topRight",
          duration: 8,
        });
      }

      // Làm mới badge đếm số lượng cảnh báo và trang danh sách cảnh báo tồn kho
      queryClient.invalidateQueries({ queryKey: ["ingredients", "alerts-count"] });
      queryClient.invalidateQueries({ queryKey: ["ingredients", "alerts"] });
      queryClient.invalidateQueries({ queryKey: ["ingredients", "low-stock"] });
    });

    // ─── notification ───
    socket.on("notification", (payload: any) => {
      console.log("[Socket.IO] Admin notification received:", payload);

      // payload.data chứa { title, body, data: { orderCode, currentStatus, ... } }
      const notifData = payload?.data ?? payload;
      const title = notifData?.title || "Thông báo hệ thống";
      const body = notifData?.body || "Bạn có một thông báo mới";

      notification.success({
        message: title,
        description: body,
        placement: "topRight",
        duration: 5,
      });

      // Làm mới danh sách đơn hàng sau 500ms để DB kịp commit
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        queryClient.invalidateQueries({ queryKey: ["order"] });
      }, 500);
    });

    // ─── exception ───
    socket.on("exception", async (error: any) => {
      const errMsg = error?.message ?? error;

      if (errMsg === "Unauthorized: Invalid token" || errMsg.includes("Unauthorized")) {
        console.warn("[Socket.IO] Token hết hạn/không hợp lệ. Đang tự động làm mới token và tái kết nối...");
        try {
          // Gọi thử một API qua apiClient để kích hoạt Axios interceptor làm mới token và cập nhật store
          await apiClient.get("/auth/me").catch(() => {});
        } catch (syncErr) {
          console.error("[Socket.IO] Lỗi khi kích hoạt làm mới token:", syncErr);
        }
      }
    });

    // ─── disconnect ───
    socket.on("disconnect", (reason: any) => {
      console.log("[Socket.IO] Admin disconnected:", reason);
      setIsConnected(false);
    });

    socket.connect();

    return () => {
      socket.emit("leave", {});
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Khi accessToken thay đổi (login/logout/refresh) ───
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.auth = accessToken ? { token: accessToken } : {};

    if (socket.connected) {
      if (accessToken) {
        // Disconnect và reconnect để áp dụng token mới vào handshake
        console.log("[Socket.IO] Tái kết nối để cập nhật token mới...");
        socket.disconnect().connect();
      } else {
        socket.emit("leave", {});
      }
    } else if (accessToken) {
      socket.connect();
    }
  }, [accessToken]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
