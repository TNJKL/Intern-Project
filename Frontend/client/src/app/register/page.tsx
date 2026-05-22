import { Metadata } from "next";
import LoginForm from "../login/components/LoginForm";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Đăng ký | Brewtra Coffee",
  description: "Tạo tài khoản mới tại Brewtra Coffee để nhận nhiều ưu đãi.",
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-[#fdfaf5]">Đang tải...</div>}>
      <LoginForm initialMode="register" />
    </Suspense>
  );
}
