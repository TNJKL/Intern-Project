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
  // Server-side auth check: kiểm tra sự tồn tại của refreshToken cookie
  const cookieStore = await cookies();
  const hasRefreshToken = cookieStore.has('refreshToken');

  // Nếu không có refreshToken, redirect sang trang tra cứu đơn hàng vãng lai
  if (!hasRefreshToken) {
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
