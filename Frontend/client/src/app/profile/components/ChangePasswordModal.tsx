"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { userService } from "@/services/user.service";
import { useAuthStore } from "@/store/zustand/useAuthStore";
import { useCartStore } from "@/store/zustand/useCartStore";
import { useAppDispatch } from "@/store/redux/hooks";
import { clearCredentials } from "@/store/redux/authSlice";
import toast from "react-hot-toast";

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

const COUNTDOWN_SECONDS = 4;

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ open, onClose }) => {
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const { clearUser } = useAuthStore();
  const clearCart = useCartStore((s) => s.clearCart);
  const dispatch = useAppDispatch();

  // Đếm ngược khi thành công
  useEffect(() => {
    if (!isSuccess) return;
    setCountdown(COUNTDOWN_SECONDS);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isSuccess]);

  // Logout khi countdown về 0 (tách riêng để tránh setState-in-render)
  useEffect(() => {
    if (isSuccess && countdown === 0) {
      dispatch(clearCredentials());
      clearUser();
      clearCart();
      window.location.href = '/login';
    }
  }, [isSuccess, countdown, dispatch, clearUser]);

  // Reset khi modal đóng
  const handleClose = () => {
    if (isSuccess) return; // Không cho đóng khi đang countdown
    setForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    setIsSuccess(false);
    setCountdown(COUNTDOWN_SECONDS);
    onClose();
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp!');
      return;
    }

    setIsSaving(true);
    try {
      await userService.changePassword({
        oldPassword: form.oldPassword,
        newPassword: form.newPassword
      });
      setForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setIsSuccess(true);
    } catch (error: any) {
      const status = error.response?.status;
      const serverMsg = error.response?.data?.message || '';
      let msg = 'Có lỗi xảy ra, vui lòng thử lại!';
      if (status === 400 || status === 401) {
        msg = 'Mật khẩu cũ không đúng!';
      } else if (serverMsg) {
        msg = serverMsg;
      }
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          {/* Backdrop — không cho đóng khi countdown */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-coffee-dark/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white w-full max-w-md rounded-[2.5rem] relative z-10 shadow-2xl overflow-hidden"
          >
            <AnimatePresence mode="wait">
              {isSuccess ? (
                /* ── Màn hình thành công ── */
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="flex flex-col items-center text-center px-10 py-12"
                >
                  {/* Icon check */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
                    className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
                    style={{ background: 'linear-gradient(135deg, #52c41a, #95de64)', boxShadow: '0 16px 40px rgba(82,196,26,0.3)' }}
                  >
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                      <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </motion.div>

                  <h2 className="text-2xl font-black text-coffee-dark mb-3 tracking-tight">
                    Đổi mật khẩu thành công!
                  </h2>
                  <p className="text-sm text-gray-400 leading-relaxed mb-8">
                    Mật khẩu của bạn đã được cập nhật.<br />
                    Vui lòng đăng nhập lại để tiếp tục.
                  </p>

                  {/* Countdown circle */}
                  <div className="flex flex-col items-center gap-3">
                    <div
                      className="w-16 h-16 rounded-full flex flex-col items-center justify-center"
                      style={{ border: '3px solid #f0f0f0', background: '#fafafa', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                    >
                      <span className="text-2xl font-black text-coffee-dark leading-none">{countdown}</span>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">giây</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      Tự động chuyển hướng sau <strong className="text-coffee-dark">{countdown}</strong> giây...
                    </p>
                  </div>
                </motion.div>
              ) : (
                /* ── Form đổi mật khẩu ── */
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-10"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />

                  <h2 className="text-2xl font-black text-coffee-dark mb-8 tracking-tight">Đổi mật khẩu</h2>

                  <form onSubmit={handleUpdatePassword} className="space-y-5">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2 block">Mật khẩu hiện tại</label>
                      <input
                        type="password"
                        value={form.oldPassword}
                        onChange={(e) => setForm({ ...form, oldPassword: e.target.value })}
                        className="w-full bg-primary/5 border border-primary/10 rounded-2xl px-6 py-4 outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all font-bold text-coffee-dark"
                        required
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2 block">Mật khẩu mới</label>
                      <input
                        type="password"
                        value={form.newPassword}
                        onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                        className="w-full bg-primary/5 border border-primary/10 rounded-2xl px-6 py-4 outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all font-bold text-coffee-dark"
                        required
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2 block">Xác nhận mật khẩu mới</label>
                      <input
                        type="password"
                        value={form.confirmPassword}
                        onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                        className="w-full bg-primary/5 border border-primary/10 rounded-2xl px-6 py-4 outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all font-bold text-coffee-dark"
                        required
                        placeholder="••••••••"
                      />
                    </div>

                    <div className="pt-4 flex gap-3">
                      <button
                        type="button"
                        onClick={handleClose}
                        className="flex-1 py-4 bg-gray-100 text-gray-500 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-gray-200 transition-all active:scale-95"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="flex-2 py-4 px-8 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {isSaving ? 'Đang lưu...' : 'Cập nhật'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ChangePasswordModal;
