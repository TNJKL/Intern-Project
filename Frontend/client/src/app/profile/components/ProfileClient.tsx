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
            return;
          }
          // Nếu response không có data (ví dụ token vừa hết hạn và interceptor chưa kịp refresh)
          // Đợi 2 giây rồi thử lại lần 2 trước khi bỏ cuộc
          await new Promise((resolve) => setTimeout(resolve, 2000));
          const retryRes = await apiClient.get("/auth/me");
          if (retryRes.data?.success && retryRes.data?.data) {
            setUser(retryRes.data.data);
          } else {
            // Thực sự không lấy được sau retry → redirect login
            window.location.href = "/login?logout=true";
          }
        } catch (error) {
          console.error("Lỗi lấy thông tin client-side:", error);
          // Nếu catch: interceptor đã thử refresh nhưng thất bại hoàn toàn
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
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <span className="text-sm font-bold text-primary/60 uppercase tracking-widest">Đang tải hồ sơ...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 pt-24 sm:pt-28 md:pt-32 pb-16 px-4 sm:px-6 font-sans">
      <div className="max-w-5xl mx-auto">

        {/* Tiêu đề trang ẩn gọn gàng */}
        <div className="mb-6 flex items-center gap-2 text-primary/40 text-[11px] font-black uppercase tracking-widest">
          <span>Tài khoản</span>
          <span>/</span>
          <span className="text-primary">Hồ sơ cá nhân</span>
        </div>

        {/* Cấu hình flex-col và xl:grid để dàn trang to rộng và cân đối trên laptop/desktop */}
        <div className="flex flex-col xl:grid xl:grid-cols-3 gap-8 items-stretch xl:items-start">

          {/* CỘT TRÁI: THẺ TÓM TẮT & HÀNH ĐỘNG */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-xl md:max-w-3xl mx-auto xl:max-w-none bg-white rounded-[32px] p-8 shadow-sm border border-primary/10 flex flex-col items-center text-center xl:sticky xl:top-28"
          >
            {/* Khung Avatar Brand */}
            <div className="relative group mb-5">
              <div className="w-32 h-32 md:w-36 md:h-36 rounded-[40px] bg-primary/10 p-1.5 shadow-inner overflow-hidden transition-transform duration-300 group-hover:scale-105">
                <div className="w-full h-full rounded-[34px] bg-white flex items-center justify-center overflow-hidden relative">
                  {user.avatarUrl ? (
                    <Image src={user.avatarUrl} alt="Avatar" fill className="object-cover" />
                  ) : (
                    <User size={56} className="text-primary/10" />
                  )}
                  {/* Lớp phủ khi Hover thay ảnh */}
                  <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-[2px]">
                    <Camera className="text-white w-6 h-6 animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-primary text-white p-2.5 rounded-2xl border-4 border-white shadow-md">
                <Sparkles size={14} />
              </div>
            </div>

            {/* Thông tin cơ bản */}
            <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">{user.fullName}</h1>
            <div className="flex flex-col items-center gap-3 mb-8 w-full">
              <span className="px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[9px] font-black uppercase tracking-widest">
                {user.role || "Thành viên"}
              </span>
              <div className="flex items-center gap-1.5 text-green-600 text-[10px] font-bold uppercase tracking-wider bg-green-50 px-3 py-1 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Trực tuyến
              </div>
            </div>

            <div className="w-full border-t border-gray-100 my-2" />

            {/* Nhóm nút bấm hành động */}
            <div className="flex flex-col sm:flex-row xl:flex-col gap-3 w-full mt-4">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-white border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Edit3 size={16} className="text-gray-400" />
                Chỉnh sửa hồ sơ
              </button>
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-white border border-primary/20 text-primary font-bold text-sm hover:bg-primary/5 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm"
              >
                <Lock size={16} className="text-primary/60" />
                Đổi mật khẩu
              </button>
            </div>
          </motion.div>

          {/* CỘT PHẢI: CHI TIẾT THÔNG TIN TÀI KHOẢN */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="w-full max-w-xl md:max-w-3xl mx-auto xl:max-w-none xl:col-span-2 bg-white rounded-[32px] p-8 md:p-10 shadow-sm border border-primary/10"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1.5 h-5 bg-primary rounded-full" />
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
    <div className="flex items-center gap-4 p-3 rounded-2xl hover:bg-primary/5 transition-colors duration-200 group">
      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300 shrink-0">
        {React.cloneElement(icon as any, { size: 18 })}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">{label}</p>
        <p className="text-base font-bold text-gray-800 truncate">{value}</p>
      </div>
    </div>
  );
}