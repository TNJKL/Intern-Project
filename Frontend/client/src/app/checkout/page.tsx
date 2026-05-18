import { Metadata } from "next";
import CheckoutClient from "./components/CheckoutClient";

export const metadata: Metadata = {
  title: "Thanh toán | Brewtra Coffee",
  description: "Hoàn tất đơn hàng của bạn tại Brewtra Coffee.",
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}
