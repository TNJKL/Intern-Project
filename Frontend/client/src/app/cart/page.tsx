import { Metadata } from "next";
import CartClient from "./components/CartClient";

export const metadata: Metadata = {
  title: "Giỏ hàng | Brewtra Coffee",
  description: "Xem và quản lý giỏ hàng của bạn tại Brewtra Coffee.",
};

export default function CartPage() {
  return <CartClient />;
}
