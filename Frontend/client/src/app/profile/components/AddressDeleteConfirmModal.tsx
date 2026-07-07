"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/api";
import type { User as UserType } from "@/types/user";

interface AddressDeleteConfirmModalProps {
  open: boolean;
  onClose: () => void;
  user: UserType;
  addressToDeleteId: string | null;
  onDeleteSuccess: (updatedUser: UserType) => Promise<void> | void;
}

export function AddressDeleteConfirmModal({
  open,
  onClose,
  user,
  addressToDeleteId,
  onDeleteSuccess,
}: AddressDeleteConfirmModalProps) {
  const [isUpdatingAddress, setIsUpdatingAddress] = useState(false);

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
        await onDeleteSuccess(res.data.data);
        onClose();
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
            onClick={onClose}
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
  );
}
