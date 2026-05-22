"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Coffee, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { apiClient } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

const registerSchema = z.object({
  fullName: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự"),
  email: z.string().email("Email không hợp lệ"),
  phone: z.string().min(10, "Số điện thoại không hợp lệ").max(11, "Số điện thoại không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterClient() {
  const router = useRouter();
  const [isSuccess, setIsSuccess] = useState(false);
  const [registeredName, setRegisteredName] = useState("");
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      const response = await apiClient.post("/auth/register", {
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        phone: data.phone
      });

      if (response.data.success) {
        setRegisteredName(data.fullName);
        setIsSuccess(true);
        toast.success("Đăng ký thành công!");
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.";
      toast.error(message);
    }
  };

  return (
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
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/register-premium-bg.png"
          alt="Background"
          fill
          className="object-cover brightness-50"
          priority
        />
      </div>

      {/* Success Overlay */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-10 max-w-md w-full text-center shadow-2xl relative overflow-hidden"
            >
              <div className="relative z-10">
                <motion.div 
                   initial={{ scale: 0 }}
                   animate={{ scale: 1 }}
                   transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                   className="w-24 h-24 bg-gradient-to-tr from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-green-500/30"
                >
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </motion.div>
                
                <h2 className="text-sm font-bold text-white/80 uppercase tracking-widest mb-4">Hoàn tất đăng ký</h2>
                
                <p className="text-3xl font-bold text-white mb-6 leading-tight">
                  Chúc mừng <span className="italic text-green-400">"{registeredName}"</span> đã đăng ký thành công!
                </p>
                
                <p className="text-white/70 text-sm mb-10 leading-relaxed">
                  Chào mừng bạn đến với đại gia đình Brewtra. Hành trình khám phá hương vị cà phê nguyên bản của bạn bắt đầu từ đây.
                </p>
                
                <div className="space-y-4">
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 3 }}
                      className="h-full bg-green-400"
                    />
                  </div>
                  <p className="text-[10px] font-medium text-white/50 uppercase tracking-widest">Đang chuyển hướng đến trang đăng nhập</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Centered form container - Glassmorphic Theme */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="w-full max-w-[440px] relative z-10"
      >
        <div className="bg-black/20 backdrop-blur-xl rounded-2xl p-8 md:p-10 border border-white/20 shadow-2xl relative overflow-hidden">
          
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-white/60 hover:text-white transition-colors mb-4 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Về trang chủ
          </Link>

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white tracking-wide mb-2">Tham gia ngay</h1>
            <p className="text-white/70 text-sm">Đăng ký để trải nghiệm trọn vẹn.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <input
                {...register("fullName")}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder:text-white/50 focus:border-white/50 focus:bg-white/20 focus:outline-none transition-all text-sm"
                placeholder="Nhập họ và tên của bạn"
              />
              {errors.fullName && <p className="mt-1 text-xs text-red-400 font-medium">{errors.fullName.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-1">
                <input
                  {...register("email")}
                  type="email"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder:text-white/50 focus:border-white/50 focus:bg-white/20 focus:outline-none transition-all text-sm"
                  placeholder="Nhập địa chỉ email"
                />
                {errors.email && <p className="mt-1 text-xs text-red-400 font-medium">{errors.email.message}</p>}
              </div>

              <div className="space-y-1">
                <input
                  {...register("phone")}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder:text-white/50 focus:border-white/50 focus:bg-white/20 focus:outline-none transition-all text-sm"
                  placeholder="Nhập số điện thoại"
                />
                {errors.phone && <p className="mt-1 text-xs text-red-400 font-medium">{errors.phone.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-1">
                <input
                  {...register("password")}
                  type="password"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder:text-white/50 focus:border-white/50 focus:bg-white/20 focus:outline-none transition-all text-sm"
                  placeholder="Nhập mật khẩu"
                />
                {errors.password && <p className="mt-1 text-xs text-red-400 font-medium">{errors.password.message}</p>}
              </div>

              <div className="space-y-1">
                <input
                  {...register("confirmPassword")}
                  type="password"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder:text-white/50 focus:border-white/50 focus:bg-white/20 focus:outline-none transition-all text-sm"
                  placeholder="Xác nhận mật khẩu"
                />
                {errors.confirmPassword && <p className="mt-1 text-xs text-red-400 font-medium">{errors.confirmPassword.message}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-white text-black py-3.5 mt-2 rounded-md font-bold text-sm hover:bg-gray-100 transition-all active:scale-[0.98] shadow-lg"
            >
              {isSubmitting ? "Đang xử lý..." : "Đăng ký ngay"}
            </button>
          </form>

          <div className="mt-6 text-center pt-6 border-t border-white/10">
            <p className="text-sm text-white/70">
              Bạn đã có tài khoản?{" "}
              <Link href="/login" className="text-white font-bold hover:underline underline-offset-4 ml-1">
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
