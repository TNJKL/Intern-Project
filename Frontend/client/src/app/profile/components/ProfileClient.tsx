"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, Calendar, MapPin, Camera, Sparkles, Lock, Edit3, Plus, Trash2, Check } from "lucide-react";
import Image from "next/image";
import EditProfileModal from "./EditProfileModal";
import ChangePasswordModal from "./ChangePasswordModal";
import type { User as UserType } from "@/types/user";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/store/zustand/useAuthStore";
import toast from "react-hot-toast";

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

  // Address CRUD States
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any | null>(null);
  const [addressLabel, setAddressLabel] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [addressIsDefault, setAddressIsDefault] = useState(false);
  const [isUpdatingAddress, setIsUpdatingAddress] = useState(false);
  const [selectedPresetLabel, setSelectedPresetLabel] = useState<string>("Nhà riêng");
  
  // Custom Delete Confirm States
  const [addressToDeleteId, setAddressToDeleteId] = useState<string | null>(null);

  const getAvatarInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    const lastWord = parts[parts.length - 1];
    return lastWord ? lastWord.charAt(0).toUpperCase() : "?";
  };

  const handleOpenAddressModal = (address: any = null) => {
    if (address) {
      setEditingAddress(address);
      setAddressLabel(address.label);
      setAddressDetail(address.detailAddress);
      setAddressIsDefault(address.isDefault);
      
      if (["Nhà riêng", "Công ty", "Trường học"].includes(address.label)) {
        setSelectedPresetLabel(address.label);
      } else {
        setSelectedPresetLabel("Khác");
      }
    } else {
      setEditingAddress(null);
      setAddressLabel("Nhà riêng");
      setAddressDetail("");
      setAddressIsDefault(!user?.addresses || user.addresses.length === 0);
      setSelectedPresetLabel("Nhà riêng");
    }
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressLabel.trim() || !addressDetail.trim() || !user) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setIsUpdatingAddress(true);
    try {
      let currentAddresses = user.addresses ? [...user.addresses] : [];
      
      if (editingAddress) {
        currentAddresses = currentAddresses.map(addr => {
          if (addr.id === editingAddress.id) {
            return {
              ...addr,
              label: addressLabel.trim(),
              detailAddress: addressDetail.trim(),
              isDefault: addressIsDefault
            };
          }
          return addressIsDefault ? { ...addr, isDefault: false } : addr;
        });
      } else {
        const newAddr = {
          id: typeof window !== "undefined" && window.crypto?.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
          label: addressLabel.trim(),
          detailAddress: addressDetail.trim(),
          isDefault: addressIsDefault
        };

        if (addressIsDefault) {
          currentAddresses = currentAddresses.map(addr => ({ ...addr, isDefault: false }));
        }
        currentAddresses.push(newAddr);
      }

      const res = await apiClient.put("/users/me", { addresses: currentAddresses });
      if (res.data?.success && res.data?.data) {
        setUser(res.data.data);
        setAuthUser(res.data.data);
        setIsAddressModalOpen(false);
        toast.success("Đã cập nhật địa chỉ thành công!");
      } else {
        toast.error(res.data?.message || "Lỗi khi cập nhật địa chỉ");
      }
    } catch (err) {
      console.error("Save address error:", err);
      toast.error("Đã xảy ra lỗi khi lưu địa chỉ");
    } finally {
      setIsUpdatingAddress(false);
    }
  };

  const handleDeleteAddress = async () => {
    if (!user || !addressToDeleteId) return;

    setIsUpdatingAddress(true);
    try {
      let currentAddresses = user.addresses ? [...user.addresses] : [];
      const addressToDelete = currentAddresses.find(a => a.id === addressToDeleteId);
      currentAddresses = currentAddresses.filter(a => a.id !== addressToDeleteId);

      if (addressToDelete?.isDefault && currentAddresses.length > 0) {
        currentAddresses[0].isDefault = true;
      }

      const res = await apiClient.put("/users/me", { addresses: currentAddresses });
      if (res.data?.success && res.data?.data) {
        setUser(res.data.data);
        setAuthUser(res.data.data);
        setAddressToDeleteId(null);
        toast.success("Đã xóa địa chỉ thành công!");
      } else {
        toast.error(res.data?.message || "Lỗi khi xóa địa chỉ");
      }
    } catch (err) {
      console.error("Delete address error:", err);
      toast.error("Đã xảy ra lỗi khi xóa địa chỉ");
    } finally {
      setIsUpdatingAddress(false);
    }
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
                    <div className="w-full h-full bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center text-white text-3xl font-black tracking-wider">
                      {getAvatarInitials(user.fullName)}
                    </div>
                  )}
                  {/* Lớp phủ khi Hover thay ảnh */}
                  <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-[2px]">
                    <Camera className="text-white w-6 h-6 animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-primary text-white p-2 rounded-lg border-2 border-white shadow-xs">
                <Sparkles size={12} />
              </div>
            </div>

            {/* Thông tin cơ bản */}
            <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">{user.fullName}</h1>
            <div className="flex flex-col items-center gap-3 mb-8 w-full">
              <span className="px-3.5 py-1 rounded bg-primary/10 border border-primary/20 text-primary text-[9px] font-black uppercase tracking-widest">
                {user.role || "Thành viên"}
              </span>
              <div className="flex items-center gap-1.5 text-green-600 text-[10px] font-bold uppercase tracking-wider bg-green-50 px-3 py-1 rounded">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Trực tuyến
              </div>
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
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1 h-5 bg-primary rounded" />
              <h3 className="text-base font-black text-gray-900 uppercase tracking-wider">Thông tin chi tiết</h3>
            </div>

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
                        className={`p-3.5 rounded-lg border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 ${
                          addr.isDefault 
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
      {isAddressModalOpen && user && (
        <div style={{ zIndex: 9999 }} className="fixed inset-0 flex items-center justify-center p-4">
          <div
            onClick={() => !isUpdatingAddress && setIsAddressModalOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-md bg-white rounded-xl overflow-hidden shadow-2xl z-10 p-6 sm:p-8"
          >
            <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-6 flex items-center gap-1.5 uppercase tracking-wide">
              {editingAddress ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ nhận hàng"}
            </h3>
            <form onSubmit={handleSaveAddress} className="space-y-5">
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">
                  Tên gợi nhớ (Nhãn) <span className="text-red-500">*</span>
                </label>
                
                {/* Chọn nhanh Label Preset */}
                <div className="flex flex-wrap gap-2 mb-2.5">
                  {["Nhà riêng", "Công ty", "Trường học", "Khác"].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setSelectedPresetLabel(preset);
                        if (preset !== "Khác") {
                          setAddressLabel(preset);
                        } else {
                          setAddressLabel("");
                        }
                      }}
                      className={`px-2.5 py-1.5 rounded-lg border text-[10px] sm:text-xs font-bold transition-all ${
                        selectedPresetLabel === preset
                          ? "bg-primary text-white border-primary shadow-xs"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                      }`}
                    >
                      {preset === "Nhà riêng" ? "🏠 Nhà riêng" : preset === "Công ty" ? "🏢 Công ty" : preset === "Trường học" ? "🏫 Trường học" : "📍 Khác"}
                    </button>
                  ))}
                </div>

                {selectedPresetLabel === "Khác" && (
                  <input
                    type="text"
                    placeholder="Nhập tên gợi nhớ tùy chỉnh (ví dụ: Nhà bạn bè, Cửa hàng...)"
                    value={addressLabel}
                    onChange={(e) => setAddressLabel(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm font-semibold text-gray-800 focus:outline-none focus:border-black transition-all outline-none"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">
                  Địa chỉ chi tiết <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                  value={addressDetail}
                  onChange={(e) => setAddressDetail(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm font-semibold text-gray-800 focus:outline-none focus:border-black transition-all outline-none resize-none"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="defaultAddressCheckbox"
                  checked={addressIsDefault}
                  disabled={!editingAddress && (!user.addresses || user.addresses.length === 0)}
                  onChange={(e) => setAddressIsDefault(e.target.checked)}
                  className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="defaultAddressCheckbox" className="text-xs sm:text-sm font-semibold text-gray-700 select-none cursor-pointer">
                  Đặt làm địa chỉ mặc định
                </label>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  disabled={isUpdatingAddress}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors uppercase tracking-wider text-xs border border-gray-200/50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingAddress}
                  className="flex-1 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 shadow-xs"
                >
                  Lưu lại
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {addressToDeleteId && (
        <div style={{ zIndex: 9999 }} className="fixed inset-0 flex items-center justify-center p-4">
          <div
            onClick={() => !isUpdatingAddress && setAddressToDeleteId(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-sm bg-white rounded-xl overflow-hidden shadow-2xl z-10 p-6 sm:p-8 border border-gray-150"
          >
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
                <Trash2 size={24} />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-black text-gray-900 uppercase tracking-wide">
                  Xác nhận xóa địa chỉ
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 font-semibold leading-relaxed">
                  Bạn có chắc chắn muốn xóa địa chỉ này khỏi sổ địa chỉ của mình? Hành động này không thể hoàn tác.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <button
                type="button"
                onClick={() => setAddressToDeleteId(null)}
                disabled={isUpdatingAddress}
                className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-lg font-bold hover:bg-gray-200 transition-colors uppercase tracking-wider text-xs border border-gray-200/50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeleteAddress}
                disabled={isUpdatingAddress}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition-colors uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 shadow-xs"
              >
                {isUpdatingAddress ? "Đang xóa..." : "Xác nhận xóa"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-primary/5 transition-colors duration-200 group">
      <div className="w-11 h-11 rounded bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300 shrink-0">
        {React.cloneElement(icon as any, { size: 18 })}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">{label}</p>
        <p className="text-base font-bold text-gray-800 truncate">{value}</p>
      </div>
    </div>
  );
}