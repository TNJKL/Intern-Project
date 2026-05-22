"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { userService, UpdateProfileData } from "@/services/userService";
import { useAuthStore } from "@/store/useAuthStore";
import toast from "react-hot-toast";

import { useRouter } from "next/navigation";

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  user: any;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ open, onClose, user }) => {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '' });
  const [isSaving, setIsSaving] = useState(false);
  const { setUser } = useAuthStore();

  useEffect(() => {
    if (user && open) {
      setForm({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user, open]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updateData: UpdateProfileData = {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
      };

      const response = await userService.updateProfile(updateData);
      const updatedUser = response.data || { ...user, ...updateData };
      
      // Cập nhật client state
      setUser(updatedUser);
      
      // Làm mới dữ liệu SSR
      router.refresh();
      
      toast.success('Cập nhật hồ sơ thành công!');
      onClose();
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Có lỗi xảy ra!';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-coffee-dark/60 backdrop-blur-md"
          ></motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white w-full max-w-md rounded-[2.5rem] p-10 relative z-10 shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
            
            <h2 className="text-2xl font-black text-coffee-dark mb-8 tracking-tight">Cập nhật hồ sơ</h2>
            
            <form onSubmit={handleUpdate} className="space-y-5">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-coffee-medium mb-2 block">Họ và tên</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full bg-coffee-light/5 border border-coffee-light/10 rounded-2xl px-6 py-4 outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all font-bold text-coffee-dark"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-coffee-medium mb-2 block">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-coffee-light/5 border border-coffee-light/10 rounded-2xl px-6 py-4 outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all font-bold text-coffee-dark"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-coffee-medium mb-2 block">Số điện thoại</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-coffee-light/5 border border-coffee-light/10 rounded-2xl px-6 py-4 outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all font-bold text-coffee-dark"
                />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-4 bg-gray-100 text-gray-500 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-gray-200 transition-all active:scale-95"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-2 py-4 px-8 bg-coffee-dark text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-primary transition-all shadow-xl shadow-coffee-dark/20 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EditProfileModal;
