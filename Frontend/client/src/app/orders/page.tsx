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
  // Server-side auth check: thử gọi refresh — nếu không có refreshToken cookie hợp lệ thì redirect
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const hasRefreshToken = allCookies.some(c => c.name === 'refreshToken' || c.name === 'refresh_token');

  // Nếu không có bất kỳ auth cookie nào, redirect sang trang tra cứu đơn hàng vãng lai
  if (!hasRefreshToken && allCookies.length === 0) {
    redirect("/orders/track");
  }

  let orders = [];
  try {
    // Fetch user's orders from the server API
    const response = await getServerApi('/api/v1/orders?size=100&sort=createdAt,desc');
    if (response?.success && response?.data) {
      orders = response.data;
    }
  } catch (error) {
    console.error("Lỗi khi tải lịch sử đơn hàng:", error);
  }

  return <OrdersClient orders={orders} />;
}
