"use client";

import React from "react";
import { Ticket } from "lucide-react";
import type { Voucher, ValidateVoucherResult } from "@/services/voucher.service";

interface CheckoutSummaryProps {
  cartItems: any[];
  vouchers: Voucher[];
  selectedVoucher: ValidateVoucherResult | null;
  setSelectedVoucher: (v: ValidateVoucherResult | null) => void;
  voucherInput: string;
  setVoucherInput: (v: string) => void;
  subTotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  isSubmitting: boolean;
  handleApplyVoucher: (e: React.MouseEvent) => void;
  onApplyVoucherSelect: (code: string) => void;
}

export default function CheckoutSummary({
  cartItems,
  vouchers,
  selectedVoucher,
  setSelectedVoucher,
  voucherInput,
  setVoucherInput,
  subTotal,
  shippingFee,
  discount,
  total,
  isSubmitting,
  handleApplyVoucher,
  onApplyVoucherSelect,
}: CheckoutSummaryProps) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-[0_10px_30px_-12px_rgba(60,42,33,0.04)] lg:sticky lg:top-24 border border-gray-50">
      <h3 className="text-base font-black text-gray-800 uppercase tracking-tight border-b border-gray-100 pb-3 mb-4">Đơn hàng của bạn</h3>

      {/* Item list */}
      <div className="space-y-4 mb-6 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
        {cartItems.map((item) => (
          <div key={item.id} className="flex justify-between items-start text-xs">
            <div className="flex-1 pr-4 min-w-0">
              <p className="font-extrabold text-gray-800 truncate">{item.quantity}x {item.name}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Size {item.sizeLabel}</p>
              {item.toppings.length > 0 && (
                <p className="text-[10px] text-primary/70 font-semibold mt-0.5 bg-primary/5 px-1.5 py-0.5 rounded inline-block max-w-full truncate">
                  + {item.toppings.map((t: any) => t.name).join(", ")}
                </p>
              )}
            </div>
            <span className="font-bold text-gray-800 shrink-0">{(item.unitPrice * item.quantity).toLocaleString('vi-VN')}đ</span>
          </div>
        ))}
      </div>

      {/* Khối Voucher Input */}
      <div className="border-t border-gray-100 pt-5 mb-5">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="MÃ GIẢM GIÁ"
            value={voucherInput}
            onChange={(e) => setVoucherInput(e.target.value)}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:border-primary/50 text-xs font-black uppercase tracking-wider placeholder:normal-case placeholder:font-normal"
          />
          <button
            type="button"
            onClick={handleApplyVoucher}
            className="bg-primary text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors shrink-0"
          >
            Áp dụng
          </button>
        </div>

        {selectedVoucher && (
          <div className="flex items-center justify-between bg-green-50/60 border border-green-200/60 text-green-700 px-3 py-2.5 rounded-xl mt-3 text-xs">
            <span className="font-bold flex items-center gap-1.5">
              <Ticket size={14} className="text-green-600" />
              Đã nhận mã: {selectedVoucher.code}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setSelectedVoucher(null);
                setVoucherInput("");
                localStorage.removeItem('brewtra_applied_voucher');
              }}
              className="text-red-500 hover:text-red-700 font-extrabold text-[11px] bg-red-50 px-2 py-0.5 rounded-md"
            >
              Gỡ bỏ
            </button>
          </div>
        )}
      </div>

      {/* Danh sách Voucher Khả dụng nhanh */}
      {vouchers.length > 0 && (
        <div className="mb-5">
          <p className="text-[10px] font-black text-gray-400 mb-2 uppercase tracking-wider">Khuyến mãi dành cho bạn:</p>
          <div className="flex flex-col gap-2 max-h-36 overflow-y-auto pr-1">
            {vouchers.map(v => {
              const isDisabled = subTotal < v.minOrderAmount;
              const isSelected = selectedVoucher?.code === v.code && selectedVoucher?.valid;
              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={isDisabled}
                  onClick={(e) => {
                    e.preventDefault();
                    onApplyVoucherSelect(v.code);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all text-xs ${isSelected
                    ? 'border-primary bg-primary/5'
                    : isDisabled
                      ? 'border-gray-100 opacity-40 cursor-not-allowed bg-gray-50/20'
                      : 'border-gray-200/60 hover:border-primary/30 bg-gray-50/40'
                    }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="font-extrabold text-gray-800 uppercase tracking-wide truncate">{v.code}</p>
                    <p className="text-[10px] text-gray-400 truncate">{v.name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-black text-primary bg-primary/5 px-2 py-0.5 rounded text-[11px]">
                      {v.discountType === 'PERCENTAGE' ? `${v.discountValue}%` : `${(v.discountValue / 1000).toLocaleString()}k`}
                    </span>
                    {isDisabled && (
                      <p className="text-[9px] text-red-500 font-medium mt-0.5">Từ {(v.minOrderAmount / 1000).toLocaleString()}k</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Phần tính toán chi phí */}
      <div className="space-y-3 text-xs font-semibold text-gray-400 border-t border-gray-100 pt-5 mb-5">
        <div className="flex justify-between">
          <span>Tạm tính</span>
          <span className="text-gray-700 font-bold">{subTotal.toLocaleString('vi-VN')}đ</span>
        </div>
        <div className="flex justify-between">
          <span>Phí giao hàng</span>
          <span className="text-gray-700 font-bold">{shippingFee.toLocaleString('vi-VN')}đ</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-green-600 bg-green-50/50 p-2 rounded-lg">
            <span>Giảm giá voucher</span>
            <span className="font-extrabold">-{discount.toLocaleString('vi-VN')}đ</span>
          </div>
        )}
      </div>

      {/* Tổng cộng */}
      <div className="border-t border-gray-100 pt-5 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-gray-400 uppercase tracking-wider">Tổng thanh toán</span>
          <span className="text-xl font-black text-primary tracking-tight">
            {total.toLocaleString('vi-VN')}đ
          </span>
        </div>
      </div>

      {/* Nút đặt hàng cuối cùng */}
      <button
        type="submit"
        disabled={isSubmitting || cartItems.length === 0}
        className="w-full bg-primary text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-primary/90 shadow-lg shadow-primary/10 transition-all active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Đang xử lý đơn..." : "Xác nhận đặt hàng"}
      </button>
    </div>
  );
}
