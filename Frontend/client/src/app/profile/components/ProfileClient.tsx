"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, Calendar, MapPin, Camera, Sparkles, Lock, Edit3 } from "lucide-react";
import Image from "next/image";
import EditProfileModal from "./EditProfileModal";
import ChangePasswordModal from "./ChangePasswordModal";
import type { User as UserType } from "@/types/user";
import { apiClient } from "@/lib/api";

interface ProfileClientProps {
  initialUser: UserType | null;
  isServerError?: boolean;
}

export default function ProfileClient({ initialUser, isServerError }: ProfileClientProps) {
  const [user, setUser] = useState<UserType | null>(initialUser);
  const [isLoading, setIsLoading] = useState(isServerError && !initialUser);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  useEffect(() => {
    if (isServerError && !user) {
      const fetchProfile = async () => {
        setIsLoading(true);
        try {
          // Gửi request lấy thông tin me bằng apiClient ở client.
          // Nếu access token hết hạn, Axios interceptor sẽ tự refresh.
          const res = await apiClient.get("/auth/me");
          if (res.data?.success && res.data?.data) {
            setUser(res.data.data);
          } else {
            // Lỗi hoặc token không hợp lệ -> chuyển hướng đăng nhập
            window.location.href = "/login?logout=true";
          }
        } catch (error) {
          console.error("Lỗi lấy thông tin client-side:", error);
          window.location.href = "/login?logout=true";
        } finally {
          setIsLoading(false);
        }
      };
      fetchProfile();
    }
  }, [isServerError, user]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#fdfaf5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-800/20 border-t-amber-800 rounded-full animate-spin" />
          <span className="text-sm font-bold text-amber-900/60 uppercase tracking-widest">Đang tải hồ sơ...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfaf5] pt-24 sm:pt-28 md:pt-32 pb-16 px-4 sm:px-6 font-sans">
      <div className="max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto"> {/* ✅ Tăng giới hạn chiều rộng trên Laptop/PC */}

        {/* Tiêu đề trang ẩn gọn gàng */}
        <div className="mb-6 flex items-center gap-2 text-amber-900/40 text-[11px] font-black uppercase tracking-widest">
          <span>Tài khoản</span>
          <span>/</span>
          <span className="text-amber-900">Hồ sơ cá nhân</span>
        </div>

        {/* ✅ Bố cục 2 cột cho màn hình từ lg (1024px) trở lên thay vì xl */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8 items-stretch lg:items-start">

          {/* CỘT TRÁI: THẺ TÓM TẮT & HÀNH ĐỘNG */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            // ✅ Sticky cột trái từ màn hình lg trở lên
            className="bg-white rounded-[32px] p-8 shadow-sm border border-amber-100/40 flex flex-col items-center text-center lg:sticky lg:top-28"
          >
            {/* Khung Avatar Brand */}
            <div className="relative group mb-5">
              <div className="w-32 h-32 md:w-36 md:h-36 rounded-[40px] bg-[#fdf3eb] p-1.5 shadow-inner overflow-hidden transition-transform duration-300 group-hover:scale-105">
                <div className="w-full h-full rounded-[34px] bg-white flex items-center justify-center overflow-hidden relative">
                  {user.avatarUrl ? (
                    <Image src={user.avatarUrl} alt="Avatar" fill className="object-cover" />
                  ) : (
                    <User size={56} className="text-amber-900/10" />
                  )}
                  {/* Lớp phủ khi Hover thay ảnh */}
                  <div className="absolute inset-0 bg-amber-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-[2px]">
                    <Camera className="text-white w-6 h-6 animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-amber-800 text-white p-2.5 rounded-2xl border-4 border-white shadow-md">
                <Sparkles size={14} />
              </div>
            </div>

            {/* Thông tin cơ bản */}
            <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">{user.fullName}</h1>
            <div className="flex flex-col items-center gap-3 mb-8 w-full">
              <span className="px-3.5 py-1 rounded-full bg-amber-50 border border-amber-100 text-amber-800 text-[9px] font-black uppercase tracking-widest">
                {user.role || "Thành viên"}
              </span>
              <div className="flex items-center gap-1.5 text-green-600 text-[10px] font-bold uppercase tracking-wider bg-green-50 px-3 py-1 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Trực tuyến
              </div>
            </div>

            <div className="w-full border-t border-gray-100 my-2" />

            {/* Nhóm nút bấm hành động */}
            {/* ✅ Xếp dọc nút bấm trên màn hình lg trở lên, các màn hình nhỏ hơn dàn hàng ngang */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full mt-4">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-white border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Edit3 size={16} className="text-gray-400" />
                Chỉnh sửa hồ sơ
              </button>
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-white border border-amber-200/60 text-amber-900 font-bold text-sm hover:bg-amber-50/40 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm"
              >
                <Lock size={16} className="text-amber-800/60" />
                Đổi mật khẩu
              </button>
            </div>
          </motion.div>

          {/* CỘT PHẢI: CHI TIẾT THÔNG TIN TÀI KHOẢN */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            // ✅ Cột phải chiếm 2 phần chiều rộng trên màn hình lg trở lên
            className="lg:col-span-2 bg-white rounded-[32px] p-8 md:p-10 shadow-sm border border-amber-100/40"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1.5 h-5 bg-amber-800 rounded-full" />
              <h3 className="text-base font-black text-gray-900 uppercase tracking-wider">Thông tin chi tiết</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              <InfoRow icon={<User />} label="Họ và tên" value={user.fullName} />
              <InfoRow icon={<Phone />} label="Số điện thoại" value={user.phone || "Chưa cập nhật"} />
              <InfoRow icon={<Mail />} label="Địa chỉ email" value={user.email} />
              <InfoRow icon={<MapPin />} label="Địa chỉ mặc định" value="Việt Nam" />

              <div className="sm:col-span-2 border-t border-gray-50 my-2" />

              <InfoRow
                icon={<Calendar />}
                label="Ngày tham gia hệ thống"
                value={user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                }) : "---"}
              />
            </div>
          </motion.div>

        </div>
      </div>

      {/* Hộp thoại chức năng */}
      <EditProfileModal open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} user={user} />
      <ChangePasswordModal open={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-2xl hover:bg-amber-50/30 transition-colors duration-200 group">
      <div className="w-11 h-11 rounded-xl bg-amber-50/60 flex items-center justify-center text-amber-800 group-hover:bg-amber-800 group-hover:text-white transition-all duration-300 shrink-0">
        {React.cloneElement(icon as any, { size: 18 })}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">{label}</p>
        <p className="text-base font-bold text-gray-800 truncate">{value}</p>
      </div>
    </div>
  );
}