import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import OrdersClient from "./components/OrdersClient";
import { getServerApi } from "@/lib/server-api";

export const metadata: Metadata = {
  title: "Đơn hàng của bạn | Brewtra Coffee",
  description: "Theo dõi và quản lý các đơn hàng cà phê của bạn tại Brewtra.",
};

export default async function OrdersPage() {
  // Server-side auth check: kiểm tra sự tồn tại của token cookie
  // LƯU Ý: refreshToken có Path=/api/v1/auth nên KHÔNG đọc được tại path /orders.
  // Dùng accessToken (Path=/) hoặc lastRefreshedToken (Path=/) thay thế.
  const cookieStore = await cookies();
  const hasSession = cookieStore.has('accessToken') || cookieStore.has('lastRefreshedToken');

  // Nếu không có session token, redirect sang trang tra cứu đơn hàng vãng lai
  if (!hasSession) {
    redirect("/orders/track");
  }

  let orders = [];
  let isServerError = false;
  try {
    // Tải danh sách đơn hàng của người dùng từ API Server
    const response = await getServerApi('/api/v1/orders?size=100&sort=createdAt,desc');
    if (response?.success && response?.data) {
      orders = response.data;
    } else if (response === null) {
      isServerError = true;
    }
  } catch (error) {
    console.error("Lỗi khi tải lịch sử đơn hàng:", error);
    isServerError = true;
  }

  return <OrdersClient initialOrders={orders} isServerError={isServerError} />;
}
