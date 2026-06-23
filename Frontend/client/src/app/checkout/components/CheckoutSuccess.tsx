"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

interface CheckoutSuccessProps {
  createdOrderCode: string;
  phone: string;
  user: any;
}

export default function CheckoutSuccess({ createdOrderCode, phone, user }: CheckoutSuccessProps) {
  return (
    <motion.div
      key="success-screen"
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      className="flex flex-col items-center justify-center p-4 py-12 max-w-md mx-auto"
    >
      <div className="bg-white p-8 md:p-10 rounded-[32px] shadow-[0_10px_40px_-10px_rgba(145,70,30,0.08)] text-center w-full border border-gray-100">
        <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-gray-800 mb-2 uppercase tracking-tight">Đặt hàng thành công!</h1>

        {createdOrderCode && (
          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 my-6 text-center">
            <p className="text-[10px] text-gray-400 font-extrabold uppercase mb-1 tracking-wider">Mã đơn hàng của bạn</p>
            <p className="text-xl font-black text-primary tracking-widest select-all">{createdOrderCode}</p>
            <p className="text-[10px] text-gray-400 mt-2">Vui lòng lưu lại mã này để tra cứu trạng thái đơn hàng.</p>
          </div>
        )}

        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đang được xử lý và sẽ sớm giao đến tay bạn.
        </p>

        <div className="space-y-3">
          {user ? (
            <Link href="/orders" className="block w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary/90 transition-all text-sm text-center shadow-md shadow-primary/10">
              Theo dõi đơn hàng
            </Link>
          ) : (
            <Link href={`/orders/track?code=${createdOrderCode}&phone=${phone}`} className="block w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary/90 transition-all text-sm text-center shadow-md shadow-primary/10">
              Theo dõi đơn hàng ngay
            </Link>
          )}
          <Link href="/" className="block w-full bg-gray-50 text-gray-600 py-4 rounded-xl font-bold hover:bg-gray-100 transition-colors border border-gray-200 text-sm text-center">
            Về trang chủ
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
