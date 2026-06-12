"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { useAuthStore } from "@/store/zustand/useAuthStore";
import { useAppDispatch } from "@/store/redux/hooks";
import { setCredentials } from "@/store/redux/authSlice";
import { signIn, getSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { AlertCircle, Coffee } from "lucide-react";
import { AnimatePresence } from "framer-motion";

const loginSchema = z.object({
    email: z.string().email("Email không hợp lệ"),
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const { setUser } = useAuthStore();
    const dispatch = useAppDispatch();

    const [loginApiError, setLoginApiError] = useState<string | null>(null);
    const [persistedError, setPersistedError] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const errClient = localStorage.getItem('last_auth_error_client');
            const errAdmin = localStorage.getItem('last_auth_error_admin');
            if (errClient) {
                try {
                    const parsed = JSON.parse(errClient);
                    setPersistedError(`[Client] ${parsed.message} (Status: ${parsed.status}) — URL: ${parsed.url || ''} — Data: ${JSON.stringify(parsed.data || '')}`);
                    localStorage.removeItem('last_auth_error_client');
                } catch {
                    setPersistedError(`[Client] Refresh failed: ${errClient}`);
                    localStorage.removeItem('last_auth_error_client');
                }
            } else if (errAdmin) {
                try {
                    const parsed = JSON.parse(errAdmin);
                    setPersistedError(`[Admin] ${parsed.message} (Status: ${parsed.status}) — URL: ${parsed.url || ''} — Data: ${JSON.stringify(parsed.data || '')}`);
                    localStorage.removeItem('last_auth_error_admin');
                } catch {
                    setPersistedError(`[Admin] Refresh failed: ${errAdmin}`);
                    localStorage.removeItem('last_auth_error_admin');
                }
            }
        }
    }, []);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormValues) => {
        setLoginApiError(null);
        try {
            const result = await signIn("credentials", {
                email: data.email,
                password: data.password,
                redirect: false,
            });

            if (result?.error) {
                setLoginApiError("Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
                return;
            }

            const session = await getSession();
            if (session?.user) {
                const user = session.user as any;
                const accessToken = (session as any).accessToken;

                dispatch(setCredentials({ user, accessToken }));
                setUser(user);

                const role = user.role?.toUpperCase();
                if (role === 'ADMIN') {
                    const authData = encodeURIComponent(JSON.stringify({ user, accessToken }));
                    window.location.href = `http://localhost:5173/admin/dashboard?auth=${authData}`;
                } else {
                    window.location.href = '/?login=success';
                }
            } else {
                setLoginApiError("Không thể lấy thông tin phiên đăng nhập.");
            }
        } catch (error: any) {
            setLoginApiError("Đã xảy ra lỗi kết nối. Vui lòng thử lại sau.");
        }
    };

    return (
        <motion.div
            key="login-page"
            initial={{ x: -120, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 120, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
        >
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-white tracking-wide mb-2">Đăng nhập</h1>
                <p className="text-white/70 text-sm">Chào mừng trở lại với Brewtra.</p>
            </div>

            {persistedError && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3.5 bg-amber-500/10 text-amber-300 rounded-xl text-xs font-medium border border-amber-500/20 flex items-start gap-2 mb-4 leading-relaxed">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                    <div>
                      <strong className="block text-amber-400 font-bold mb-0.5">Lỗi tự động làm mới token (Auto-Logout Cause):</strong>
                      <span>{persistedError}</span>
                    </div>
                </motion.div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {loginApiError && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-red-500/10 text-red-400 rounded-xl text-xs font-semibold border border-red-500/20 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{loginApiError}</span>
                    </motion.div>
                )}

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
                        {...register("password")}
                        type="password"
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder:text-white/50 focus:border-white/50 focus:bg-white/20 focus:outline-none transition-all text-sm"
                        placeholder="Mật khẩu"
                    />
                    <div className="text-right mt-1">
                        <button type="button" className="text-[11px] text-white/50 hover:text-white uppercase tracking-wider">Quên mật khẩu?</button>
                    </div>
                    {errors.password && <p className="mt-1 text-xs text-red-400 font-medium">{errors.password.message}</p>}
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-white text-black py-3.5 mt-2 rounded-md font-bold text-sm hover:bg-gray-100 transition-all active:scale-[0.98] shadow-lg"
                >
                    {isSubmitting ? "Đang xử lý..." : "Đăng nhập ngay"}
                </button>
            </form>

            <div className="mt-6 text-center pt-6 border-t border-white/10">
                <p className="text-sm text-white/70">
                    Chưa có tài khoản?{" "}
                    <button onClick={() => router.push("/register")} className="text-white font-bold hover:underline underline-offset-4 ml-1">
                        Đăng ký ngay
                    </button>
                </p>
            </div>
        </motion.div>
    );
}