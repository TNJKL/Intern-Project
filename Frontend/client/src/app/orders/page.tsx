import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import OrdersClient from "./components/OrdersClient";

export const metadata: Metadata = {
  title: "Đơn hàng của bạn | Brewtra Coffee",
  description: "Theo dõi và quản lý các đơn hàng cà phê của bạn tại Brewtra.",
};

// Mock data — thay thế bằng API khi Backend sẵn sàng
const MOCK_ORDERS = [
  {
    id: "ORD-847291",
    date: "24/04/2026 15:30",
    status: "delivering",
    total: 103000,
    items: [
      { id: "1", name: "Phin Sữa Đá", size: "M", quantity: 2, price: 29000, image: "/images/product-cappuccino-new.jpg" },
      { id: "2", name: "Trà Sen Vàng", size: "L", quantity: 1, price: 45000, image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop" }
    ]
  },
  {
    id: "ORD-847200",
    date: "20/04/2026 09:15",
    status: "completed",
    total: 89000,
    items: [
      { id: "3", name: "Cold Brew", size: "M", quantity: 1, price: 55000, image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&h=400&fit=crop" },
      { id: "4", name: "Bánh Mì Que", size: "M", quantity: 2, price: 15000, image: "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=400&h=400&fit=crop" }
    ]
  }
];

export default async function OrdersPage() {
  // Server-side auth check: thử gọi refresh — nếu không có refreshToken cookie hợp lệ thì redirect
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const hasRefreshToken = allCookies.some(c => c.name === 'refreshToken' || c.name === 'refresh_token');

  // Nếu không có bất kỳ auth cookie nào, redirect ngay
  if (!hasRefreshToken && allCookies.length === 0) {
    redirect("/login");
  }

  return <OrdersClient orders={MOCK_ORDERS} />;
}
