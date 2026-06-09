"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
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
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormValues>({
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
                toast.success("Đăng ký thành công!");
                router.push("/login");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Đăng ký thất bại.");
        }
    };

    return (
        <motion.div
            key="register-page"
            initial={{ x: 120, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -120, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
        >
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-white tracking-wide mb-2">Tham gia ngay</h1>
                <p className="text-white/70 text-sm">Đăng ký để trải nghiệm trọn vẹn.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
                <div className="space-y-1">
                    <input
                        {...register("fullName")}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder:text-white/50 focus:border-white/50 focus:bg-white/20 focus:outline-none transition-all text-sm"
                        placeholder="Nhập họ và tên của bạn"
                        autoComplete="none"
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
                            autoComplete="one-time-code"
                        />
                        {errors.email && <p className="mt-1 text-xs text-red-400 font-medium">{errors.email.message}</p>}
                    </div>

                    <div className="space-y-1">
                        <input
                            {...register("phone")}
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder:text-white/50 focus:border-white/50 focus:bg-white/20 focus:outline-none transition-all text-sm"
                            placeholder="Nhập số điện thoại"
                            autoComplete="none"
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
                            placeholder="Mật khẩu"
                            autoComplete="new-password"
                        />
                        {errors.password && <p className="mt-1 text-xs text-red-400 font-medium">{errors.password.message}</p>}
                    </div>

                    <div className="space-y-1">
                        <input
                            {...register("confirmPassword")}
                            type="password"
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder:text-white/50 focus:border-white/50 focus:bg-white/20 focus:outline-none transition-all text-sm"
                            placeholder="Xác nhận mật khẩu"
                            autoComplete="new-password"
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
                    <button onClick={() => router.push("/login")} className="text-white font-bold hover:underline underline-offset-4 ml-1">
                        Đăng nhập ngay
                    </button>
                </p>
            </div>
        </motion.div>
    );
}