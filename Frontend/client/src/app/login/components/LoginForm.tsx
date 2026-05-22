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
import { useAuthStore } from "@/store/useAuthStore";
import { useAppDispatch } from "@/store/hooks";
import { setCredentials } from "@/store/authSlice";
import axios from "axios";

const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
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
  const [apiError, setApiError] = useState<string | null>(null);
  const [loginSuccessData, setLoginSuccessData] = useState<{ name: string, role: string } | null>(null);

  const onSubmit = async (data: LoginFormValues) => {
    setApiError(null);
    try {
      // Gọi qua Route Handler cục bộ để xử lý cookie
      const response = await axios.post('/api/auth/login', {
        email: data.email,
        password: data.password,
      });

      if (response.data.success) {
        const { user, accessToken } = response.data.data;
        
        // Lưu vào Redux và Zustand
        dispatch(setCredentials({ user, accessToken }));
        setUser(user);

        setLoginSuccessData({ name: user.fullName, role: user.role });

        // Chuyển hướng
        setTimeout(() => {
          const role = user.role?.toUpperCase();
          if (role === 'ADMIN') {
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

      <div className="min-h-[100dvh] relative grid place-items-center py-8 px-4 overflow-y-auto font-sans">
        <style dangerouslySetInnerHTML={{__html: `
          input:-webkit-autofill,
          input:-webkit-autofill:hover, 
          input:-webkit-autofill:focus, 
          input:-webkit-autofill:active {
              transition: background-color 5000s ease-in-out 0s, color 5000s ease-in-out 0s;
              -webkit-text-fill-color: white !important;
          }
        `}} />
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/register-premium-bg.png"
            alt="Coffee aesthetic background"
            fill
            className="object-cover brightness-50"
            priority
          />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
          className="w-full max-w-[440px] relative z-10"
        >
          <div className="bg-black/20 backdrop-blur-xl rounded-2xl p-8 md:p-10 border border-white/20 shadow-2xl relative overflow-hidden">
            <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-white/60 hover:text-white transition-colors mb-4 group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Về trang chủ
            </Link>

            <div className="mb-6">
              <h1 className="text-3xl font-bold text-white tracking-wide mb-2">Đăng nhập</h1>
              <p className="text-white/70 text-sm">Chào mừng trở lại với Brewtra.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {apiError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-500/10 text-red-400 rounded-lg text-xs font-semibold border border-red-500/20 flex items-start gap-2 backdrop-blur-md mb-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{apiError}</span>
                </motion.div>
              )}

              <div className="space-y-1">
                <input
                  {...register("email")}
                  type="email"
                  autoComplete="email"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder:text-white/50 focus:border-white/50 focus:bg-white/20 focus:outline-none transition-all text-sm"
                  placeholder="Nhập địa chỉ email"
                />
                {errors.email && <p className="mt-1 text-xs text-red-400 font-medium">{errors.email.message}</p>}
              </div>

              <div className="space-y-1">
                <div className="flex justify-end items-center mb-1">
                  <a href="#" className="text-[10px] font-semibold text-white/50 hover:text-white transition-colors uppercase tracking-widest">Quên mật khẩu?</a>
                </div>
                <input
                  {...register("password")}
                  type="password"
                  autoComplete="current-password"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder:text-white/50 focus:border-white/50 focus:bg-white/20 focus:outline-none transition-all text-sm"
                  placeholder="Nhập mật khẩu"
                />
                {errors.password && <p className="mt-1 text-xs text-red-400 font-medium">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-white text-black py-3.5 mt-6 rounded-md font-bold text-sm hover:bg-gray-100 transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full" />
                    Đang xử lý...
                  </>
                ) : "Đăng nhập ngay"}
              </button>
            </form>

            <div className="mt-6 text-center pt-6 border-t border-white/10">
              <p className="text-sm text-white/70">
                Chưa có tài khoản?{" "}
                <Link href="/register" className="text-white font-bold hover:underline underline-offset-4 ml-1">
                  Đăng ký ngay
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
