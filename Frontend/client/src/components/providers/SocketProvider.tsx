"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAppSelector, useAppDispatch } from "@/store/redux/hooks";
import { updateAccessToken } from "@/store/redux/authSlice";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  /** Gọi hàm này sau khi guest đặt hàng thành công để join room mới */
  joinGuestRoom: (guestSessionId: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  joinGuestRoom: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { accessToken } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();

  // Sync httpOnly access token into Redux on mount (so socket can read it)
  useEffect(() => {
    if (!accessToken) {
      fetch("/api/auth/token")
        .then((r) => r.json())
        .then((data) => {
          if (data?.accessToken) {
            dispatch(updateAccessToken({ accessToken: data.accessToken }));
          }
        })
        .catch(() => {});
    }
  }, [accessToken, dispatch]);

  // ─── Bootstrap socket connection ───
  useEffect(() => {
    const backendIp =
      process.env.NEXT_PUBLIC_GLOBAL_BACKEND_IP || "http://localhost:8080";

    const socket = io(`${backendIp}/notifications`, {
      path: "/ws",
      transports: ["websocket", "polling"], // websocket ưu tiên, polling dự phòng
      autoConnect: false,
      auth: accessToken ? { token: accessToken } : {},
    });

    socketRef.current = socket;

    // ─── connect ───
    socket.on("connect", () => {
      console.log("[Socket.IO] Connected:", socket.id);
      setIsConnected(true);

      if (accessToken) {
        // Luồng user đã đăng nhập: join không cần payload
        socket.emit("join", {});
      } else {
        // Luồng guest: join với guestSessionId nếu đang theo dõi đơn
        const guestSessionId = localStorage.getItem("brewtra_guest_session_id");
        if (guestSessionId) {
          socket.emit("join-guest", { guestSessionId });
        }
      }
    });

    // ─── joined (user đã đăng nhập) ───
    socket.on("joined", (data: { room: string; success: boolean } | null) => {
      console.log("[Socket.IO] Joined user room:", data?.room);
    });

    // ─── joined-guest (khách vãng lai) ───
    socket.on(
      "joined-guest",
      (data: { room: string; orderCode: string; success: boolean } | null) => {
        console.log("[Socket.IO] Joined guest room:", data?.room);
      }
    );

    // ─── notification ───
    socket.on("notification", (payload: any) => {
      console.log("[Socket.IO] Notification received:", payload);

      // payload.data chứa { title, body, data: { orderCode, currentStatus, ... } }
      const notifData = payload?.data ?? payload;
      const title = notifData?.title || "Thông báo mới";
      const body = notifData?.body || "Bạn có một cập nhật đơn hàng.";

      toast.success(
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-sm">{title}</span>
          <span className="text-xs text-gray-600">{body}</span>
        </div>,
        { duration: 6000, position: "top-right" }
      );

      // Làm mới Server Component (OrdersPage sẽ re-fetch từ getServerApi)
      router.refresh();
    });

    // ─── exception (lỗi xác thực) ───
    socket.on("exception", (error: any) => {
      console.error("[Socket.IO] Exception:", error?.message ?? error);
    });

    // ─── error (guest session hết hạn) ───
    socket.on("error", (error: any) => {
      if (error?.message === "Invalid or expired guest session") {
        console.warn("[Socket.IO] Guest session expired — clearing localStorage");
        localStorage.removeItem("brewtra_guest_session_id");
        localStorage.removeItem("brewtra_guest_order_code");
      } else {
        console.error("[Socket.IO] Error:", error?.message ?? error);
      }
    });

    // ─── disconnect ───
    socket.on("disconnect", (reason) => {
      console.log("[Socket.IO] Disconnected:", reason);
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

  // ─── Khi accessToken thay đổi (login/logout) ───
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    // Cập nhật auth và reconnect để backend nhận token mới
    socket.auth = accessToken ? { token: accessToken } : {};

    if (socket.connected) {
      if (accessToken) {
        socket.emit("join", {});
      } else {
        // Logout: rời phòng
        socket.emit("leave", {});
      }
    } else if (accessToken) {
      // Token xuất hiện sau khi mount (vd. sau đăng nhập) → reconnect
      socket.connect();
    }
  }, [accessToken]);

  /**
   * Gọi hàm này ngay sau khi guest đặt hàng thành công để join room mới.
   * Cũng được lưu vào localStorage để tự động join lại khi reload trang.
   */
  const joinGuestRoom = (guestSessionId: string) => {
    const socket = socketRef.current;
    if (!socket) return;

    localStorage.setItem("brewtra_guest_session_id", guestSessionId);

    if (socket.connected) {
      socket.emit("join-guest", { guestSessionId });
    } else {
      socket.connect(); // sự kiện connect sẽ tự emit join-guest
    }
  };

  return (
    <SocketContext.Provider
      value={{ socket: socketRef.current, isConnected, joinGuestRoom }}
    >
      {children}
    </SocketContext.Provider>
  );
};
