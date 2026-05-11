"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Coffee, ArrowLeft, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { useAppDispatch } from "@/store/hooks";
import { setCredentials } from "@/store/authSlice";
import axios from "axios";

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

  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();
  const dispatch = useAppDispatch();
  const logoutParam = searchParams.get('logout');

  useEffect(() => {
    if (logoutParam === 'true') {
      // Logout được xử lý bởi CustomerLayout, chỉ cần clean URL
      router.replace('/login');
    }
  }, [logoutParam, router]);

  const [apiError, setApiError] = useState<string | null>(null);
  const [loginSuccessData, setLoginSuccessData] = useState<{ name: string, role: string } | null>(null);

  const onSubmit = async (data: LoginFormValues) => {
    setApiError(null);
    try {
      // Gọi qua Route Handler cục bộ để xử lý cookie cho localhost
      const response = await axios.post('/api/auth/login', {
        email: data.email,
        password: data.password,
      });

      if (response.data.success) {
        const { user, accessToken } = response.data.data;
        // refreshToken đã được Backend set vào httpOnly cookie tự động

        // Lưu accessToken vào Redux RAM, user vào Zustand localStorage
        dispatch(setCredentials({ user, accessToken }));
        setUser(user);

        setLoginSuccessData({ name: user.fullName, role: user.role });

        // Delay redirect so user can read the welcome message
        setTimeout(() => {
          if (user.role === 'ADMIN') {
            const authData = encodeURIComponent(JSON.stringify({ user, accessToken }));
            window.location.href = `http://localhost:5173/admin/dashboard?auth=${authData}`;
          } else {
            router.push('/');
          }
        }, 1500);
      } else {
        setApiError(response.data.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.';
      setApiError(errorMsg);
    }
  };

  return (
    <>
      <AnimatePresence>
        {loginSuccessData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 25 }}
              className="bg-gradient-to-br from-coffee-dark to-[#1a120b] p-10 md:p-14 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(211,117,51,0.3)] border border-white/10 flex flex-col items-center max-w-sm w-[90%] text-center relative overflow-hidden"
            >
              {/* Decorative gradient glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-primary/30 blur-[60px] rounded-full pointer-events-none"></div>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: 360 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 15 }}
                className="w-24 h-24 bg-gradient-to-tr from-primary to-[#ff9b5a] rounded-full flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(211,117,51,0.4)] relative z-10"
              >
                <Coffee className="w-12 h-12 text-white drop-shadow-md" />
              </motion.div>

              <h2 className="text-xl font-bold text-white/60 tracking-widest uppercase mb-1 relative z-10">Brewtra</h2>
              <p className="text-sm text-white/40 font-medium mb-3 relative z-10">Xin chào,</p>
              <h3 className="text-3xl font-black text-white mb-8 tracking-tight relative z-10">{loginSuccessData.name}</h3>

              <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-full border border-white/10 text-sm text-white/70 font-medium relative z-10 backdrop-blur-sm">
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  className="w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_rgba(211,117,51,0.8)]"
                />
                Đang chuyển hướng...
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-screen relative flex items-center justify-center p-4 md:p-8 overflow-hidden bg-[#f5e6d3]">
        {/* Full Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/login-custom-bg.png"
            alt="Coffee aesthetic background"
            fill
            className="object-cover"
            priority
          />
          {/* Subtle overlay to improve readability if needed */}
          <div className="absolute inset-0 bg-black/5"></div>
        </div>

        {/* Centered Login Form Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
          className="w-full max-w-[400px] relative z-10"
        >
          {/* Decorative glow behind form */}
          <div className="absolute inset-0 bg-primary/15 blur-[80px] -z-10 rounded-full scale-110"></div>

          {/* Lighter Brown Gradient Glassmorphism Card */}
          <div className="bg-gradient-to-br from-[#4a2e10] to-[#6b3a1f] backdrop-blur-xl rounded-[2.5rem] p-8 md:p-10 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden relative">
            {/* Top accent line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>

            <Link href="/" className="inline-flex items-center gap-2 text-[9px] font-black text-white/30 hover:text-primary transition-colors mb-8 group uppercase tracking-[0.2em]">
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
              Trang chủ
            </Link>

            <div className="mb-8">
              <h1 className="text-3xl font-black text-white tracking-tighter mb-1 uppercase leading-none">Đăng nhập</h1>
              <p className="text-white/30 font-medium text-xs">Chào mừng bạn trở lại với <span className="text-primary font-bold">Brewtra</span>.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {apiError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-500/10 text-red-400 rounded-xl text-[10px] font-bold border border-red-500/20 flex items-start gap-2 backdrop-blur-md"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{apiError}</span>
                </motion.div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[9px] font-black text-white/20 uppercase tracking-[0.2em] ml-1">Email</label>
                <input
                  {...register("email")}
                  type="email"
                  autoComplete="email"
                  className="w-full px-5 py-3.5 rounded-xl border border-white/5 bg-white/5 text-white placeholder:text-white/10 focus:bg-white/10 focus:ring-4 focus:ring-primary/10 focus:border-primary/40 outline-none transition-all text-sm font-medium shadow-inner"
                  placeholder="name@example.com"
                />
                {errors.email && <p className="mt-1 text-[9px] text-red-400 font-bold ml-1">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="block text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Mật khẩu</label>
                  <a href="#" className="text-[9px] font-bold text-primary hover:text-white transition-colors uppercase tracking-widest">Quên?</a>
                </div>
                <input
                  {...register("password")}
                  type="password"
                  autoComplete="current-password"
                  className="w-full px-5 py-3.5 rounded-xl border border-white/5 bg-white/5 text-white placeholder:text-white/10 focus:bg-white/10 focus:ring-4 focus:ring-primary/10 focus:border-primary/40 outline-none transition-all text-sm font-medium shadow-inner"
                  placeholder="••••••••"
                />
                {errors.password && <p className="mt-1 text-[9px] text-red-400 font-bold ml-1">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-primary to-[#ff9b5a] text-white py-4 rounded-xl font-black uppercase tracking-[0.15em] text-xs hover:scale-[1.02] hover:shadow-[0_15px_30px_-8px_rgba(211,117,51,0.4)] transition-all active:scale-[0.98] mt-4 shadow-lg relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isSubmitting ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                      Đang xử lý...
                    </>
                  ) : "Tiếp tục ngay"}
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              </button>
            </form>

            <div className="mt-8 text-center pt-6 border-t border-white/5">
              <p className="text-xs text-white/20 font-medium">
                Chưa có tài khoản?{" "}
                <Link href="/register" className="text-primary font-black hover:text-white transition-colors uppercase tracking-widest text-[10px] ml-1">
                  Đăng ký
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
