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
    <div className="min-h-screen bg-[#fdfaf5] pt-32 pb-20 px-6 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full translate-x-1/3 -translate-y-1/3"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-coffee-light/5 blur-[100px] rounded-full -translate-x-1/3 translate-y-1/3"></div>

      <div className="max-w-5xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="bg-white/70 backdrop-blur-3xl rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(60,42,33,0.1)] overflow-hidden border border-white/40"
        >
          {/* Header Area */}
          <div className="relative h-64 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#3c2a21] via-[#4a352a] to-[#d37533]"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/coffee-beans.png')] opacity-15"></div>
            
            <div className="absolute inset-0 flex items-center px-12 pt-8">
              <div className="flex items-center gap-10">
                {/* Avatar */}
                <motion.div whileHover={{ scale: 1.05 }} className="relative">
                  <div className="w-40 h-40 rounded-[2.5rem] bg-white p-2 shadow-2xl overflow-hidden relative">
                    <div className="w-full h-full rounded-[2rem] bg-gradient-to-br from-coffee-light/10 to-coffee-light/5 flex items-center justify-center overflow-hidden group">
                      {user.avatarUrl ? (
                        <Image src={user.avatarUrl} alt="Avatar" fill className="object-cover" />
                      ) : (
                        <User className="w-20 h-20 text-coffee-dark/10" />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer">
                        <Camera className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </div>
                  <div className="absolute -right-2 -bottom-2 w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-white border-4 border-white shadow-lg">
                    <Sparkles size={18} />
                  </div>
                </motion.div>

                {/* Name & Role next to Avatar */}
                <div className="text-white space-y-3">
                  <motion.h1 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-5xl font-black tracking-tight"
                  >
                    {user.fullName}
                  </motion.h1>
                  <div className="flex items-center gap-3">
                    <span className="px-4 py-1.5 rounded-xl bg-white/20 backdrop-blur-md text-white font-black text-[10px] uppercase tracking-widest border border-white/20">
                      {user.role}
                    </span>
                    <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div> Trực tuyến
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="p-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              
              {/* Left & Center: Basic Info */}
              <div className="lg:col-span-2 space-y-10">
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                  <h3 className="text-xl font-black text-coffee-dark uppercase tracking-wider">Thông tin cơ bản</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <InfoItem icon={<Mail />} label="Email liên hệ" value={user.email} />
                  <InfoItem icon={<Phone />} label="Số điện thoại" value={user.phone || "Chưa cập nhật"} />
                  <InfoItem icon={<MapPin />} label="Địa chỉ" value="Việt Nam" />
                  <InfoItem icon={<Calendar />} label="Ngày tham gia" value={user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : "---"} />
                </div>
              </div>

              {/* Right: Actions Form */}
              <div className="space-y-10">
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-8 bg-coffee-dark rounded-full"></div>
                  <h3 className="text-xl font-black text-coffee-dark uppercase tracking-wider">Tùy chỉnh</h3>
                </div>

                <div className="bg-coffee-light/5 rounded-[2.5rem] p-8 border border-coffee-light/10 space-y-4">
                  <p className="text-xs font-bold text-coffee-medium/60 uppercase tracking-widest px-2 mb-4">Quản lý tài khoản</p>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsEditModalOpen(true)}
                    className="w-full flex items-center gap-4 p-5 rounded-2xl bg-white border border-coffee-light/20 text-coffee-dark font-black text-[11px] uppercase tracking-widest shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Settings size={20} />
                    </div>
                    Cập nhật hồ sơ
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsPasswordModalOpen(true)}
                    className="w-full flex items-center gap-4 p-5 rounded-2xl bg-coffee-dark text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-coffee-dark/20 hover:bg-[#4a352a] transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                      <Lock size={20} />
                    </div>
                    Đổi mật khẩu
                  </motion.button>

                  <div className="mt-6 pt-6 border-t border-coffee-light/10">
                    <div className="flex items-center gap-3 text-green-600 px-2">
                      <Shield size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Tài khoản bảo mật</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      </div>

      <EditProfileModal open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} user={user} />
      <ChangePasswordModal open={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <motion.div 
      whileHover={{ x: 5 }}
      className="flex items-center gap-5 p-6 bg-white rounded-3xl border border-coffee-light/5 shadow-sm"
    >
      <div className="w-14 h-14 rounded-2xl bg-coffee-light/5 flex items-center justify-center text-primary">
        {React.cloneElement(icon as any, { size: 24 })}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-coffee-medium/40 mb-1">{label}</p>
        <p className="text-lg font-bold text-coffee-dark truncate">{value}</p>
      </div>
    </motion.div>
  );
}
