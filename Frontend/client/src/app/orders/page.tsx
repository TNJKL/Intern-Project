import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import OrdersClient from "./components/OrdersClient";
import { getServerApi } from "@/lib/server-api";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "Đơn hàng của bạn | Brewtra Coffee",
  description: "Theo dõi và quản lý các đơn hàng cà phê của bạn tại Brewtra.",
};

export default async function OrdersPage() {
  const session = await auth();
  const cookieStore = await cookies();
  
  // Kiểm tra quyền truy cập của cả CUSTOMER và ADMIN
  const hasSession = 
    !!session?.accessToken || 
    cookieStore.has('accessToken') || 
    cookieStore.has('lastRefreshedToken') ||
    cookieStore.has('adminAccessToken') || 
    cookieStore.has('adminLastRefreshedToken');

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
