"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/api";
import type { User as UserType } from "@/types/user";

interface AddressModalProps {
  open: boolean;
  onClose: () => void;
  user: UserType;
  editingAddress: any | null;
  onSaveSuccess: (updatedUser: UserType) => Promise<void> | void;
}

export function AddressModal({
  open,
  onClose,
  user,
  editingAddress,
  onSaveSuccess,
}: AddressModalProps) {
  const [addressLabel, setAddressLabel] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [addressIsDefault, setAddressIsDefault] = useState(false);
  const [isUpdatingAddress, setIsUpdatingAddress] = useState(false);
  const [selectedPresetLabel, setSelectedPresetLabel] = useState<string>("Nhà riêng");

  useEffect(() => {
    if (open) {
      if (editingAddress) {
        setAddressLabel(editingAddress.label);
        setAddressDetail(editingAddress.detailAddress);
        setAddressIsDefault(editingAddress.isDefault);

        if (["Nhà riêng", "Công ty", "Trường học"].includes(editingAddress.label)) {
          setSelectedPresetLabel(editingAddress.label);
        } else {
          setSelectedPresetLabel("Khác");
        }
      } else {
        setAddressLabel("Nhà riêng");
        setAddressDetail("");
        setAddressIsDefault(!user?.addresses || user.addresses.length === 0);
        setSelectedPresetLabel("Nhà riêng");
      }
    }
  }, [editingAddress, user, open]);

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
        await onSaveSuccess(res.data.data);
        onClose();
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

  if (!open) return null;

  return (
    <div style={{ zIndex: 9999 }} className="fixed inset-0 flex items-center justify-center p-4">
      <div
        onClick={() => !isUpdatingAddress && onClose()}
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
                  className={`px-2.5 py-1.5 rounded-lg border text-[10px] sm:text-xs font-bold transition-all ${selectedPresetLabel === preset
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
              onClick={onClose}
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
  );
}
