"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, Calendar, MapPin, Camera, Lock, Edit3, Plus, Trash2, Check, Sparkles } from "lucide-react";
import Image from "next/image";
import EditProfileModal from "./EditProfileModal";
import ChangePasswordModal from "./ChangePasswordModal";
import type { User as UserType } from "@/types/user";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/store/zustand/useAuthStore";
import { orderService } from "@/services/order.service";
import { InfoRow } from "./InfoRow";
import { StatsSection } from "./StatsSection";
import { AddressModal } from "./AddressModal";
import { AddressDeleteConfirmModal } from "./AddressDeleteConfirmModal";

interface ProfileClientProps {
  initialUser: UserType | null;
  isServerError?: boolean;
}

export default function ProfileClient({ initialUser, isServerError }: ProfileClientProps) {
  const [user, setUser] = useState<UserType | null>(initialUser);
  const [isLoading, setIsLoading] = useState(isServerError && !initialUser);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const { setUser: setAuthUser } = useAuthStore();

  // Address Modal States
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any | null>(null);

  // Custom Delete Confirm States
  const [addressToDeleteId, setAddressToDeleteId] = useState<string | null>(null);

  // Stats States
  const [stats, setStats] = useState<{
    tier: "GUEST" | "MEMBER" | "VIP";
    totalSpent: number;
    totalOrders: number;
  } | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  const getAvatarInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    const lastWord = parts[parts.length - 1];
    return lastWord ? lastWord.charAt(0).toUpperCase() : "?";
  };

  const handleOpenAddressModal = (address: any = null) => {
    setEditingAddress(address);
    setIsAddressModalOpen(true);
  };

  const handleUserUpdate = (updatedUser: UserType) => {
    setUser(updatedUser);
    setAuthUser(updatedUser);
  };

  useEffect(() => {
    if (isServerError && !user) {
      const fetchProfile = async () => {
        setIsLoading(true);
        try {
          const res = await apiClient.get("/users/me");
          if (res.data?.success && res.data?.data) {
            setUser(res.data.data);
            setAuthUser(res.data.data);
            return;
          }
          await new Promise((resolve) => setTimeout(resolve, 2000));
          const retryRes = await apiClient.get("/users/me");
          if (retryRes.data?.success && retryRes.data?.data) {
            setUser(retryRes.data.data);
            setAuthUser(retryRes.data.data);
          } else {
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

  useEffect(() => {
    if (user) {
      const fetchStats = async () => {
        setIsStatsLoading(true);
        try {
          const res = await orderService.getMyTier();
          if (res?.success && res?.data) {
            setStats({
              tier: res.data.tier,
              totalSpent: res.data.totalSpent,
              totalOrders: res.data.totalOrders,
            });
          }
        } catch (err) {
          console.error("Lỗi khi lấy thông tin hạng thành viên:", err);
        } finally {
          setIsStatsLoading(false);
        }
      };
      fetchStats();
    }
  }, [user]);

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
    <div className="min-h-screen bg-secondary/30 pt-16 sm:pt-20 md:pt-8 pb-16 px-4 sm:px-6 font-sans">
      <div className="max-w-5xl mx-auto">

        {/* Tiêu đề trang ẩn gọn gàng */}
        <div className="mb-6 flex items-center gap-2 text-primary/40 text-[11px] font-black uppercase tracking-widest">
          <span>Tài khoản</span>
          <span>/</span>
          <span className="text-primary">Hồ sơ cá nhân</span>
        </div>

        {/* Cấu hình flex-col và xl:grid để dàn trang to rộng và cân đối trên laptop/desktop */}
        <div className="flex flex-col xl:grid xl:grid-cols-3 gap-6 items-stretch xl:items-start">

          {/* CỘT TRÁI: THẺ TÓM TẮT & HÀNH ĐỘNG */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-xl md:max-w-3xl mx-auto xl:max-w-none bg-white rounded-xl p-8 shadow-xs border border-primary/10 flex flex-col items-center text-center xl:sticky xl:top-28"
          >
            {/* Khung Avatar Brand */}
            <div className="relative group mb-5">
              <div className="w-32 h-32 md:w-36 md:h-36 rounded-lg bg-primary/10 p-1 shadow-inner overflow-hidden transition-transform duration-300 group-hover:scale-[1.02]">
                <div className="w-full h-full rounded bg-white flex items-center justify-center overflow-hidden relative">
                  {user.avatarUrl ? (
                    <Image src={user.avatarUrl} alt="Avatar" fill className="object-cover" />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${getAvatarGradient(user.email)} flex items-center justify-center text-white text-3xl font-black tracking-wider relative overflow-hidden`}>
                      <span className="relative z-10">{getAvatarInitials(user.fullName)}</span>
                    </div>
                  )}
                  {/* Lớp phủ khi Hover thay ảnh */}
                  <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-[2px]">
                    <Camera className="text-white w-6 h-6 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>

            {/* Thông tin cơ bản */}
            <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-4">{user.fullName}</h1>
            <div className="flex flex-col items-center gap-3 mb-6 w-full">
              {/* Hạng thành viên Badge */}
              {stats && (
                <div className="flex items-center justify-center">
                  {stats.tier === "VIP" && (
                    <span className="px-2.5 py-1 rounded-md bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-yellow-600/10 border border-yellow-500/30 text-yellow-600 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-xs animate-pulse">
                      👑 Khách VIP
                    </span>
                  )}
                  {stats.tier === "MEMBER" && (
                    <span className="px-2.5 py-1 rounded-md bg-gradient-to-r from-slate-100 to-slate-200 border border-slate-300 text-slate-700 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-xs">
                      🥈 Khách hàng thân thiết
                    </span>
                  )}
                  {stats.tier === "GUEST" && (
                    <span className="px-2.5 py-1 rounded-md bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-700 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-xs">
                      🥉 Khách hàng
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="w-full border-t border-gray-100 my-2" />

            {/* Nhóm nút bấm hành động */}
            <div className="flex flex-col sm:flex-row xl:flex-col gap-3 w-full mt-4">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex-1 py-3 px-6 rounded-lg bg-white border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <Edit3 size={16} className="text-gray-400" />
                Chỉnh sửa hồ sơ
              </button>
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="flex-1 py-3 px-6 rounded-lg bg-white border border-primary/20 text-primary font-bold text-sm hover:bg-primary/5 transition-all active:scale-[0.99] flex items-center justify-center gap-2 shadow-xs"
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
            className="w-full max-w-xl md:max-w-3xl mx-auto xl:max-w-none xl:col-span-2 bg-white rounded-xl p-8 md:p-10 shadow-xs border border-primary/10"
          >
            <h3 className="text-base sm:text-lg font-black text-gray-800 uppercase tracking-tight mb-6 md:mb-8 pb-4 border-b border-gray-100 flex items-center gap-2">
              <Sparkles size={18} className="text-primary" /> Thông tin tài khoản chi tiết
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              <InfoRow icon={<User />} label="Họ và tên" value={user.fullName} />
              <InfoRow icon={<Phone />} label="Số điện thoại" value={user.phone || "Chưa cập nhật"} />
              <InfoRow icon={<Mail />} label="Địa chỉ email" value={user.email} />
              <InfoRow icon={<MapPin />} label="Địa chỉ mặc định" value={user.addresses?.find(a => a.isDefault)?.detailAddress || "Chưa cập nhật"} />

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

              <StatsSection stats={stats} />

              <div className="sm:col-span-2 border-t border-gray-150 my-4" />

              {/* Sổ địa chỉ cá nhân */}
              <div className="sm:col-span-2 space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin size={16} className="text-primary" /> Sổ địa chỉ nhận hàng
                  </h4>
                  <button
                    onClick={() => handleOpenAddressModal(null)}
                    className="py-1.5 px-3 rounded-lg bg-primary/10 border border-primary/20 text-primary font-bold text-xs hover:bg-primary/20 transition-all flex items-center gap-1"
                  >
                    <Plus size={14} /> Thêm mới
                  </button>
                </div>

                {!user.addresses || user.addresses.length === 0 ? (
                  <div className="p-6 rounded-lg bg-gray-50 border border-dashed border-gray-200 text-center text-gray-400 text-xs font-semibold">
                    Bạn chưa lưu địa chỉ nào. Vui lòng thêm địa chỉ để đặt hàng nhanh hơn!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {user.addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`p-3.5 rounded-lg border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 ${addr.isDefault
                          ? "bg-primary/[0.01] border-primary/30 shadow-xs"
                          : "bg-white border-gray-200 hover:border-gray-300"
                          }`}
                      >
                        <div className="flex-1 min-w-0 flex items-start gap-2.5">
                          <span className="shrink-0 mt-0.5 px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[10px] font-black uppercase tracking-wider">
                            {addr.label === "Nhà riêng" ? "🏠 Nhà riêng" : addr.label === "Công ty" ? "🏢 Công ty" : addr.label === "Trường học" ? "🏫 Trường học" : "📍 " + addr.label}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-xs sm:text-sm text-gray-800 font-bold leading-normal truncate">{addr.detailAddress}</p>
                              {addr.isDefault && (
                                <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[8px] font-black uppercase tracking-wider flex items-center gap-0.5 shrink-0">
                                  <Check size={8} className="stroke-[3]" /> Mặc định
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 shrink-0 border-t sm:border-t-0 border-gray-100/80 pt-2 sm:pt-0">
                          <button
                            onClick={() => handleOpenAddressModal(addr)}
                            className="p-1 text-gray-400 hover:text-primary transition-colors hover:bg-primary/5 rounded"
                            title="Chỉnh sửa"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => setAddressToDeleteId(addr.id)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors hover:bg-red-50/80 rounded"
                            title="Xóa địa chỉ"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Hộp thoại chức năng */}
      <EditProfileModal open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} user={user} />
      <ChangePasswordModal open={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />

      {/* Modal Thêm/Sửa Địa chỉ */}
      <AddressModal
        open={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        user={user}
        editingAddress={editingAddress}
        onSaveSuccess={handleUserUpdate}
      />

      {/* Custom Delete Confirmation Modal */}
      <AddressDeleteConfirmModal
        open={!!addressToDeleteId}
        onClose={() => setAddressToDeleteId(null)}
        user={user}
        addressToDeleteId={addressToDeleteId}
        onDeleteSuccess={handleUserUpdate}
      />
    </div>
  );
}

const getAvatarGradient = (email: string) => {
  const gradients = [
    "from-amber-600 to-amber-800", // Caramel Blend
    "from-emerald-600 to-teal-700", // Matcha Green
    "from-orange-500 to-amber-600", // Honey Peach
    "from-stone-600 to-stone-800",  // Mocha Dark
    "from-rose-700 to-red-800",     // Berry Tea
    "from-primary to-amber-500"     // Brewtra Signature
  ];
  if (!email) return gradients[5];
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
};