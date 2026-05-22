import { Metadata } from "next";
import RegisterClient from "./components/RegisterClient";

export const metadata: Metadata = {
  title: "Đăng ký | Brewtra Coffee",
  description: "Tạo tài khoản mới tại Brewtra Coffee để nhận nhiều ưu đãi.",
};

export default function RegisterPage() {
  return <RegisterClient />;
}
