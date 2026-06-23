"use client";

import React from "react";
import { MapPin } from "lucide-react";

interface CheckoutShippingFormProps {
  user: any;
  isGuest: boolean;
  name: string;
  setName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  note: string;
  setNote: (v: string) => void;
}

export default function CheckoutShippingForm({
  user,
  isGuest,
  name,
  setName,
  phone,
  setPhone,
  email,
  setEmail,
  address,
  setAddress,
  note,
  setNote,
}: CheckoutShippingFormProps) {
  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 md:p-8 shadow-[0_10px_30px_-12px_rgba(60,42,33,0.04)] border border-transparent hover:border-gray-100 transition-all">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-xl text-primary">
          <MapPin className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-black text-gray-800 uppercase tracking-tight">Thông tin giao hàng</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {!isGuest && (
          <div className="md:col-span-2 flex flex-col gap-2 mb-2">
            <div className="flex items-center gap-3 bg-primary/5 border border-primary/10 rounded-xl px-4 py-3">
              <div className="w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center font-black text-sm shrink-0">
                {(user?.fullName || user?.name || user?.userName || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-gray-800 text-sm">{user?.fullName || user?.name || user?.userName || 'Thành viên'}</p>
                <p className="text-xs text-gray-500">{user?.email || user?.userEmail || 'Chưa cập nhật Email'}</p>
              </div>
              <span className="ml-auto text-[9px] font-black text-primary bg-primary/10 px-2 py-1 rounded-full uppercase tracking-wider">Thành viên</span>
            </div>
          </div>
        )}

        {isGuest && (
          <>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Họ và tên</label>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập họ và tên người nhận"
                className="w-full bg-gray-50 border border-gray-200/60 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Số điện thoại</label>
              <input
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Nhập số điện thoại"
                className="w-full bg-gray-50 border border-gray-200/60 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Địa chỉ Email</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Để nhận thông tin trạng thái đơn hàng"
                className="w-full bg-gray-50 border border-gray-200/60 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all placeholder:text-gray-400"
              />
            </div>
          </>
        )}

        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Địa chỉ nhận hàng</label>
          <input
            required
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
            className="w-full bg-gray-50 border border-gray-200/60 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all placeholder:text-gray-400"
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Ghi chú đơn hàng</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ghi chú thêm cho quán (ví dụ: ít đá, không đường, shipper gọi trước khi giao...)"
            className="w-full bg-gray-50 border border-gray-200/60 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all resize-none h-24 placeholder:text-gray-400"
          ></textarea>
        </div>
      </div>
    </div>
  );
}
