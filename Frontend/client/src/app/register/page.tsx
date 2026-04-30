"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Coffee, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";

const registerSchema = z.object({
  fullName: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự"),
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterFormValues) => {
    console.log(data);
    // Handle registration logic
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-8">
      <div className="absolute inset-0 z-0">
        <Image 
          src="/images/register-bg.jpg" 
          alt="Coffee background" 
          fill 
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-primary/40 mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-2xl bg-white/95 backdrop-blur-2xl p-8 sm:p-12 rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border border-white/20 relative z-10"
      >
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary transition-colors mb-8 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Trở về
        </Link>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-10">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center shadow-sm shrink-0 border border-primary/20">
            <Coffee className="w-10 h-10 text-primary" />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl sm:text-4xl font-black text-gray-800 tracking-tight mb-2 uppercase">Tham gia Brewtra</h1>
            <p className="text-gray-500 font-medium leading-relaxed max-w-md">
              Mở khóa những đặc quyền độc quyền, tích điểm mỗi lần thưởng thức và khám phá thế giới cà phê nguyên bản.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">Họ và tên</label>
              <input
                {...register("fullName")}
                className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 bg-[#fdfaf5] focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-gray-800 placeholder-gray-400"
                placeholder="Nguyễn Văn A"
              />
              {errors.fullName && <p className="mt-2 text-xs text-red-500 font-bold">{errors.fullName.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">Email</label>
              <input
                {...register("email")}
                type="email"
                className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 bg-[#fdfaf5] focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-gray-800 placeholder-gray-400"
                placeholder="name@example.com"
              />
              {errors.email && <p className="mt-2 text-xs text-red-500 font-bold">{errors.email.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">Mật khẩu</label>
              <input
                {...register("password")}
                type="password"
                className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 bg-[#fdfaf5] focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-gray-800 placeholder-gray-400"
                placeholder="••••••••"
              />
              {errors.password && <p className="mt-2 text-xs text-red-500 font-bold">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">Xác nhận mật khẩu</label>
              <input
                {...register("confirmPassword")}
                type="password"
                className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 bg-[#fdfaf5] focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-gray-800 placeholder-gray-400"
                placeholder="••••••••"
              />
              {errors.confirmPassword && <p className="mt-2 text-xs text-red-500 font-bold">{errors.confirmPassword.message}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-[0.98] mt-4"
          >
            {isSubmitting ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500 font-medium">
            Đã có tài khoản Brewtra?{" "}
            <Link href="/login" className="text-primary font-black hover:text-primary/80 hover:underline transition-colors uppercase tracking-wide ml-1">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
