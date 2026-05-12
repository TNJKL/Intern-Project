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

export default function RegisterPage() {
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
    <div className="h-screen relative flex items-center justify-end p-6 md:p-12 lg:p-24 overflow-hidden bg-[#fdfaf5] font-noto">
      {/* Success Overlay */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-coffee-dark/80 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white border border-coffee-light/20 rounded-[3rem] p-10 max-w-md w-full text-center shadow-[0_50px_100px_-20px_rgba(60,42,33,0.3)] relative overflow-hidden"
            >
              <div className="relative z-10">
                <motion.div 
                   initial={{ scale: 0 }}
                   animate={{ scale: 1 }}
                   transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                   className="w-24 h-24 bg-gradient-to-tr from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-green-500/30"
                >
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </motion.div>
                
                <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4">Hoàn tất đăng ký</h2>
                
                <p className="text-3xl font-black text-coffee-dark mb-6 leading-tight uppercase tracking-tight">
                  Chúc mừng <span className="text-primary italic">"{registeredName}"</span> đã đăng ký thành công!
                </p>
                
                <p className="text-coffee-medium/60 font-medium text-sm mb-10 leading-relaxed">
                  Chào mừng bạn đến với đại gia đình Brewtra. Hành trình khám phá hương vị cà phê nguyên bản của bạn bắt đầu từ đây.
                </p>
                
                <div className="space-y-4">
                  <div className="w-full h-1 bg-coffee-light/20 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 3 }}
                      className="h-full bg-gradient-to-r from-primary to-[#ff9b5a]"
                    />
                  </div>
                  <p className="text-[9px] font-black text-coffee-medium/20 uppercase tracking-widest">Đang chuyển hướng đến trang đăng nhập</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Crystal Clear Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/register-custom-bg.jpg"
          alt="Registration background"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Right-aligned form container - Compact Professional Theme */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="w-full max-w-[420px] relative z-10"
      >
        <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] p-6 md:p-8 shadow-[0_40px_80px_-15px_rgba(60,42,33,0.15)] border border-white/50 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>

          <Link href="/" className="inline-flex items-center gap-2 text-[9px] font-black text-coffee-medium/50 hover:text-primary transition-colors mb-5 group uppercase tracking-[0.2em]">
            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
            Về trang chủ
          </Link>

          <div className="mb-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <Coffee className="w-4.5 h-4.5 text-white" />
              </div>
              <h1 className="text-xl font-black text-coffee-dark tracking-tighter uppercase">Tham gia ngay</h1>
            </div>
            <p className="text-coffee-medium/60 font-medium text-[9px] leading-tight">
              Gia nhập đại gia đình cà phê <span className="text-primary font-bold">Brewtra</span>.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            <div className="space-y-1">
              <label className="block text-[8px] font-black text-coffee-medium uppercase tracking-[0.2em] ml-1">Họ và tên</label>
              <input
                {...register("fullName")}
                className="w-full px-4 py-3 rounded-xl border border-coffee-light/10 bg-coffee-light/5 text-coffee-dark placeholder:text-coffee-medium/20 focus:bg-white focus:ring-2 focus:ring-primary/5 focus:border-primary/20 outline-none transition-all text-xs font-bold shadow-sm"
                placeholder="Nguyễn Văn A"
              />
              {errors.fullName && <p className="mt-0.5 text-[8px] text-red-500 font-bold ml-1">{errors.fullName.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="block text-[8px] font-black text-coffee-medium uppercase tracking-[0.2em] ml-1">Email</label>
                <input
                  {...register("email")}
                  type="email"
                  className="w-full px-4 py-3 rounded-xl border border-coffee-light/10 bg-coffee-light/5 text-coffee-dark placeholder:text-coffee-medium/20 focus:bg-white focus:ring-2 focus:ring-primary/5 focus:border-primary/20 outline-none transition-all text-xs font-bold shadow-sm"
                  placeholder="name@email.com"
                />
                {errors.email && <p className="mt-0.5 text-[8px] text-red-500 font-bold ml-1">{errors.email.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="block text-[8px] font-black text-coffee-medium uppercase tracking-[0.2em] ml-1">Điện thoại</label>
                <input
                  {...register("phone")}
                  className="w-full px-4 py-3 rounded-xl border border-coffee-light/10 bg-coffee-light/5 text-coffee-dark placeholder:text-coffee-medium/20 focus:bg-white focus:ring-2 focus:ring-primary/5 focus:border-primary/20 outline-none transition-all text-xs font-bold shadow-sm"
                  placeholder="09xx xxx xxx"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="block text-[8px] font-black text-coffee-medium uppercase tracking-[0.2em] ml-1">Mật khẩu</label>
                <input
                  {...register("password")}
                  type="password"
                  className="w-full px-4 py-3 rounded-xl border border-coffee-light/10 bg-coffee-light/5 text-coffee-dark placeholder:text-coffee-medium/20 focus:bg-white focus:ring-2 focus:ring-primary/5 focus:border-primary/20 outline-none transition-all text-xs font-bold shadow-sm"
                  placeholder="••••"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[8px] font-black text-coffee-medium uppercase tracking-[0.2em] ml-1">Xác nhận</label>
                <input
                  {...register("confirmPassword")}
                  type="password"
                  className="w-full px-4 py-3 rounded-xl border border-coffee-light/10 bg-coffee-light/5 text-coffee-dark placeholder:text-coffee-medium/20 focus:bg-white focus:ring-2 focus:ring-primary/5 focus:border-primary/20 outline-none transition-all text-xs font-bold shadow-sm"
                  placeholder="••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-coffee-dark to-[#4a352a] text-white py-3.5 rounded-xl font-black uppercase tracking-[0.15em] text-[10px] hover:shadow-xl hover:shadow-coffee-dark/10 transition-all active:scale-[0.98] mt-3 relative overflow-hidden group"
            >
              <span className="relative z-10">
                {isSubmitting ? "Đang xử lý..." : "Đăng ký ngay"}
              </span>
              <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </button>
          </form>

          <div className="mt-5 text-center pt-5 border-t border-coffee-light/5">
            <p className="text-[9px] text-coffee-medium/60 font-medium">
              Bạn đã có tài khoản?{" "}
              <Link href="/login" className="text-primary font-black hover:text-coffee-dark transition-colors uppercase tracking-[0.1em] ml-1 underline underline-offset-4">
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
