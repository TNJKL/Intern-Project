"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Coffee, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";

const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormValues) => {
    console.log(data);
    // Handle login logic
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left side - Decorative Image */}
      <div className="hidden lg:flex w-1/2 relative bg-coffee-dark items-center justify-center overflow-hidden">
        <Image
          src="/images/login-bg.jpg"
          alt="Coffee pouring"
          fill
          sizes="50vw"
          className="object-cover opacity-60 mix-blend-overlay"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="relative z-10 text-center text-white px-12"
        >
          <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20">
            <Coffee className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-black uppercase tracking-widest mb-4">Brewtra</h2>
          <p className="text-white/80 text-lg max-w-md">Đánh thức ngày mới của bạn bằng hương vị nguyên bản và thuần khiết nhất.</p>
        </motion.div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-[#fdfaf5] relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md relative z-10"
        >
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-primary transition-colors mb-12 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Quay lại trang chủ
          </Link>

          <div className="mb-10">
            <h1 className="text-4xl font-black text-coffee-dark tracking-tight mb-2">Đăng nhập</h1>
            <p className="text-gray-500 font-medium">Chào mừng bạn trở lại với Brewtra.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-black text-coffee-dark uppercase tracking-wider mb-2">Email</label>
              <input
                {...register("email")}
                type="email"
                className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-white focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary/50 outline-none transition-all shadow-sm font-medium"
                placeholder="name@example.com"
              />
              {errors.email && <p className="mt-2 text-xs text-red-500 font-medium">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-black text-coffee-dark uppercase tracking-wider">Mật khẩu</label>
                <a href="#" className="text-xs font-bold text-primary hover:underline hover:text-coffee-dark transition-colors">Quên mật khẩu?</a>
              </div>
              <input
                {...register("password")}
                type="password"
                className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-white focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary/50 outline-none transition-all shadow-sm font-medium"
                placeholder="••••••••"
              />
              {errors.password && <p className="mt-2 text-xs text-red-500 font-medium">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-wider hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-[0.98] mt-4"
            >
              {isSubmitting ? "Đang xử lý..." : "Đăng nhập"}
            </button>
          </form>

          <div className="mt-12 text-center">
            <p className="text-sm text-gray-500 font-medium">
              Chưa có tài khoản?{" "}
              <Link href="/register" className="text-primary font-black hover:text-coffee-dark hover:underline transition-colors">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
