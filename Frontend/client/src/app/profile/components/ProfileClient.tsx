"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, Calendar, Shield, MapPin, Camera, Sparkles, Settings, Lock } from "lucide-react";
import Image from "next/image";
import EditProfileModal from "./EditProfileModal";
import ChangePasswordModal from "./ChangePasswordModal";
import type { User as UserType } from "@/types/user";

interface ProfileClientProps {
  user: UserType;
}

export default function ProfileClient({ user }: ProfileClientProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#fdfaf5] pt-32 pb-20 px-6 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Profile Header Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[32px] p-8 md:p-12 shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row items-center gap-8 md:gap-12"
        >
          <div className="relative group">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-[40px] bg-[#fdf3eb] p-1 shadow-inner overflow-hidden">
              <div className="w-full h-full rounded-[36px] bg-white flex items-center justify-center overflow-hidden relative">
                {user.avatarUrl ? (
                  <Image src={user.avatarUrl} alt="Avatar" fill className="object-cover" />
                ) : (
                  <User size={64} className="text-gray-200" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <Camera className="text-white w-8 h-8" />
                </div>
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-primary text-white p-2.5 rounded-2xl border-4 border-white shadow-lg">
              <Sparkles size={16} />
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">{user.fullName}</h1>
              <span className="px-4 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
                {user.role}
              </span>
            </div>
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                <Mail size={16} className="text-primary/60" /> {user.email}
              </div>
              <div className="flex items-center gap-2 text-green-600 text-[10px] font-black uppercase tracking-widest">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Trực tuyến
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 min-w-[180px]">
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="w-full py-3 px-6 rounded-2xl bg-white border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-all active:scale-95"
            >
              Chỉnh sửa hồ sơ
            </button>
            <button 
              onClick={() => setIsPasswordModalOpen(true)}
              className="w-full py-3 px-6 rounded-2xl bg-[#4d362b] text-white font-bold text-sm shadow-lg shadow-[#4d362b]/20 hover:bg-[#3c2a21] transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Lock size={16} /> Đổi mật khẩu
            </button>
          </div>
        </motion.div>

        {/* Info Card - Centered and Full Width */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-[32px] p-8 md:p-12 shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3 mb-10">
            <div className="w-1.5 h-6 bg-primary rounded-full" />
            <h3 className="text-lg font-black text-gray-900 uppercase tracking-wider">Thông tin tài khoản</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            <InfoRow icon={<Phone />} label="Số điện thoại" value={user.phone || "Chưa cập nhật"} />
            <InfoRow icon={<Mail />} label="Email liên hệ" value={user.email} />
            <InfoRow icon={<MapPin />} label="Địa chỉ mặc định" value="Việt Nam" />
            <InfoRow icon={<Calendar />} label="Ngày đăng ký" value={user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : "---"} />
          </div>
        </motion.div>
      </div>

      <EditProfileModal open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} user={user} />
      <ChangePasswordModal open={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center gap-5 group">
      <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
        {React.cloneElement(icon as any, { size: 20 })}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">{label}</p>
        <p className="text-base font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}
