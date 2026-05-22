"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Coffee, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/zustand/useAuthStore";
import { useAppDispatch } from "@/store/redux/hooks";
import { setCredentials } from "@/store/redux/authSlice";
import axios from "axios";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/api";

// ─── VALIDATION SCHEMAS ───
const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

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

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

// ─── FRAMER MOTION SLIDE VARIANTS ───
const slideVariants = {
  enter: (direction: number) => ({
    x: direction * 160,
    opacity: 0,
    scale: 0.96,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: -direction * 160,
    opacity: 0,
    scale: 0.96,
  }),
};

interface LoginFormProps {
  initialMode?: 'login' | 'register';
}

export default function LoginForm({ initialMode = 'login' }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();
  const dispatch = useAppDispatch();

  // ─── MODES & DIRECTIONS STATES ───
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [direction, setDirection] = useState(1);

  // Sync mode state with initialMode if it changes on first mount
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const handleToggleMode = (newMode: 'login' | 'register') => {
    setDirection(newMode === 'register' ? 1 : -1);
    setMode(newMode);
    // Smooth address bar update without reloading the page!
    window.history.pushState(null, '', newMode === 'login' ? '/login' : '/register');
  };

  // ─── SUB-COMPONENTS ───

  // 1. LOGIN VIEW
  const LoginView = () => {
    const {
      register: registerLogin,
      handleSubmit: handleLoginSubmit,
      formState: { errors: loginErrors, isSubmitting: isLoginSubmitting },
    } = useForm<LoginFormValues>({
      resolver: zodResolver(loginSchema),
    });

    const [loginApiError, setLoginApiError] = useState<string | null>(null);
    const [loginSuccessData, setLoginSuccessData] = useState<{ name: string; role: string } | null>(null);

    const onLoginSubmit = async (data: LoginFormValues) => {
      setLoginApiError(null);
      try {
        const response = await axios.post('/api/auth/login', {
          email: data.email,
          password: data.password,
        });

        if (response.data.success) {
          const { user, accessToken } = response.data.data;
          
          dispatch(setCredentials({ user, accessToken }));
          setUser(user);
          setLoginSuccessData({ name: user.fullName, role: user.role });

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
          setLoginApiError(response.data.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
        }
      } catch (error: any) {
        const errorMsg = error.response?.data?.message || 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.';
        setLoginApiError(errorMsg);
      }
    };

    return (
      <div className="relative">
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

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white tracking-wide mb-2">Đăng nhập</h1>
          <p className="text-white/70 text-sm">Chào mừng trở lại với Brewtra.</p>
        </div>

        <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="space-y-4">
          {loginApiError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-500/10 text-red-400 rounded-lg text-xs font-semibold border border-red-500/20 flex items-start gap-2 backdrop-blur-md mb-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{loginApiError}</span>
            </motion.div>
          )}

          <div className="space-y-1">
            <input
              {...registerLogin("email")}
              type="email"
              autoComplete="email"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder:text-white/50 focus:border-white/50 focus:bg-white/20 focus:outline-none transition-all text-sm"
              placeholder="Nhập địa chỉ email"
            />
            {loginErrors.email && <p className="mt-1 text-xs text-red-400 font-medium">{loginErrors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <div className="flex justify-end items-center mb-1">
              <a href="#" className="text-[10px] font-semibold text-white/50 hover:text-white transition-colors uppercase tracking-widest">Quên mật khẩu?</a>
            </div>
            <input
              {...registerLogin("password")}
              type="password"
              autoComplete="current-password"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder:text-white/50 focus:border-white/50 focus:bg-white/20 focus:outline-none transition-all text-sm"
              placeholder="Nhập mật khẩu"
            />
            {loginErrors.password && <p className="mt-1 text-xs text-red-400 font-medium">{loginErrors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoginSubmitting}
            className="w-full bg-white text-black py-3.5 mt-6 rounded-md font-bold text-sm hover:bg-gray-100 transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
          >
            {isLoginSubmitting ? (
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
            <button
              onClick={() => handleToggleMode('register')}
              className="text-white font-bold hover:underline underline-offset-4 ml-1 focus:outline-none"
            >
              Đăng ký ngay
            </button>
          </p>
        </div>
      </div>
    );
  };

  // 2. REGISTER VIEW
  const RegisterView = () => {
    const {
      register: registerReg,
      handleSubmit: handleRegSubmit,
      formState: { errors: regErrors, isSubmitting: isRegSubmitting },
    } = useForm<RegisterFormValues>({
      resolver: zodResolver(registerSchema),
    });

    const [isRegSuccess, setIsRegSuccess] = useState(false);
    const [registeredName, setRegisteredName] = useState("");

    const onRegSubmit = async (data: RegisterFormValues) => {
      try {
        const response = await apiClient.post("/auth/register", {
          email: data.email,
          password: data.password,
          fullName: data.fullName,
          phone: data.phone,
        });

        if (response.data.success) {
          setRegisteredName(data.fullName);
          setIsRegSuccess(true);
          toast.success("Đăng ký thành công!");
          setTimeout(() => {
            handleToggleMode('login');
          }, 3000);
        }
      } catch (error: any) {
        const message = error.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.";
        toast.error(message);
      }
    };

    return (
      <div className="relative">
        <AnimatePresence>
          {isRegSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xl flex items-center justify-center p-6"
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

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white tracking-wide mb-2">Tham gia ngay</h1>
          <p className="text-white/70 text-sm">Đăng ký để trải nghiệm trọn vẹn.</p>
        </div>

        <form onSubmit={handleRegSubmit(onRegSubmit)} className="space-y-4">
          <div className="space-y-1">
            <input
              {...registerReg("fullName")}
              autoComplete="off"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder:text-white/50 focus:border-white/50 focus:bg-white/20 focus:outline-none transition-all text-sm"
              placeholder="Nhập họ và tên của bạn"
            />
            {regErrors.fullName && <p className="mt-1 text-xs text-red-400 font-medium">{regErrors.fullName.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <input
                {...registerReg("email")}
                type="email"
                autoComplete="off"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder:text-white/50 focus:border-white/50 focus:bg-white/20 focus:outline-none transition-all text-sm"
                placeholder="Nhập email"
              />
              {regErrors.email && <p className="mt-1 text-xs text-red-400 font-medium">{regErrors.email.message}</p>}
            </div>

            <div className="space-y-1">
              <input
                {...registerReg("phone")}
                autoComplete="off"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder:text-white/50 focus:border-white/50 focus:bg-white/20 focus:outline-none transition-all text-sm"
                placeholder="Nhập số điện thoại"
              />
              {regErrors.phone && <p className="mt-1 text-xs text-red-400 font-medium">{regErrors.phone.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <input
                {...registerReg("password")}
                type="password"
                autoComplete="new-password"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder:text-white/50 focus:border-white/50 focus:bg-white/20 focus:outline-none transition-all text-sm"
                placeholder="Mật khẩu"
              />
              {regErrors.password && <p className="mt-1 text-xs text-red-400 font-medium">{regErrors.password.message}</p>}
            </div>

            <div className="space-y-1">
              <input
                {...registerReg("confirmPassword")}
                type="password"
                autoComplete="new-password"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder:text-white/50 focus:border-white/50 focus:bg-white/20 focus:outline-none transition-all text-sm"
                placeholder="Xác nhận mật khẩu"
              />
              {regErrors.confirmPassword && <p className="mt-1 text-xs text-red-400 font-medium">{regErrors.confirmPassword.message}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={isRegSubmitting}
            className="w-full bg-white text-black py-3.5 mt-4 rounded-md font-bold text-sm hover:bg-gray-100 transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
          >
            {isRegSubmitting ? (
              <>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full" />
                Đang xử lý...
              </>
            ) : "Đăng ký ngay"}
          </button>
        </form>

        <div className="mt-6 text-center pt-6 border-t border-white/10">
          <p className="text-sm text-white/70">
            Bạn đã có tài khoản?{" "}
            <button
              onClick={() => handleToggleMode('login')}
              className="text-white font-bold hover:underline underline-offset-4 ml-1 focus:outline-none"
            >
              Đăng nhập ngay
            </button>
          </p>
        </div>
      </div>
    );
  };

  // ─── MAIN RENDER ───
  return (
    <div className="min-h-[100dvh] relative grid place-items-center py-8 px-4 overflow-y-auto font-sans">
      <style dangerouslySetInnerHTML={{__html: `
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 1000px #1d130c inset !important;
            -webkit-text-fill-color: #ffffff !important;
            caret-color: #ffffff !important;
        }
      `}} />
      
      {/* Background Image */}
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
        {/* Animated layout height and components inside */}
        <motion.div 
          layout="position" 
          transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
          className="bg-black/20 backdrop-blur-xl rounded-2xl p-8 md:p-10 border border-white/20 shadow-2xl relative overflow-hidden"
        >
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-white/60 hover:text-white transition-colors mb-6 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Về trang chủ
          </Link>

          {/* Gorgeous sliding page transition */}
          <div className="relative overflow-hidden">
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              {mode === 'login' ? (
                <motion.div
                  key="login"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
                >
                  <LoginView />
                </motion.div>
              ) : (
                <motion.div
                  key="register"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
                >
                  <RegisterView />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
