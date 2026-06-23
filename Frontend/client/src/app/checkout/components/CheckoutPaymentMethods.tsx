"use client";

import React from "react";
import { CreditCard, Truck } from "lucide-react";

interface CheckoutPaymentMethodsProps {
  paymentMethod: string;
  setPaymentMethod: (v: string) => void;
}

export default function CheckoutPaymentMethods({
  paymentMethod,
  setPaymentMethod,
}: CheckoutPaymentMethodsProps) {
  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 md:p-8 shadow-[0_10px_30px_-12px_rgba(60,42,33,0.04)] border border-transparent hover:border-gray-100 transition-all">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-xl text-primary">
          <CreditCard className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-black text-gray-800 uppercase tracking-tight">Phương thức thanh toán</h2>
      </div>

      <div className="space-y-3">
        <label className={`flex items-start gap-3.5 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-primary/20 bg-gray-50/20'}`}>
          <input
            type="radio"
            name="payment"
            value="cod"
            checked={paymentMethod === 'cod'}
            onChange={() => setPaymentMethod('cod')}
            className="w-4 h-4 mt-0.5 accent-primary"
          />
          <div className="flex-1 flex items-start gap-3">
            <Truck className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-gray-800 text-sm">Thanh toán khi nhận hàng (COD)</p>
              <p className="text-xs text-gray-400 mt-0.5">Trả bằng tiền mặt trực tiếp cho shipper khi nhận được hàng.</p>
            </div>
          </div>
        </label>

        <label className={`flex items-start gap-3.5 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'vnpay' ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-primary/20 bg-gray-50/20'}`}>
          <input
            type="radio"
            name="payment"
            value="vnpay"
            checked={paymentMethod === 'vnpay'}
            onChange={() => setPaymentMethod('vnpay')}
            className="w-4 h-4 mt-0.5 accent-primary"
          />
          <div className="flex-1 flex items-start gap-3">
            <div className="w-5 h-5 bg-blue-600 text-white rounded flex items-center justify-center font-black text-[9px] shrink-0">VN</div>
            <div>
              <p className="font-bold text-gray-800 text-sm">Ví VNPay / Ứng dụng ngân hàng (QR Pay)</p>
              <p className="text-xs text-gray-400 mt-0.5">Hệ thống chuyển hướng an toàn đến cổng thanh toán trực tuyến VNPay.</p>
            </div>
          </div>
        </label>
      </div>
    </div>
  );
}
