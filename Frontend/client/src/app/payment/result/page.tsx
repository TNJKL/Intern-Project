"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  const [orderCode, setOrderCode] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [bankCode, setBankCode] = useState<string>("");

  useEffect(() => {
    const responseCode = searchParams.get("vnp_ResponseCode");
    const txnRef = searchParams.get("vnp_TxnRef");
    const vnpAmount = searchParams.get("vnp_Amount");
    const vnpBank = searchParams.get("vnp_BankCode");

    // vnp_ResponseCode = '00' đại diện cho giao dịch thành công trong VNPay
    if (responseCode === "00") {
      setIsSuccess(true);
    } else {
      setIsSuccess(false);
    }

    if (txnRef) setOrderCode(txnRef);
    if (vnpAmount) {
      // VNPay nhân số tiền lên 100 lần khi gửi đi, chia lại 100 để hiển thị tiền thực tế
      const realAmount = Number(vnpAmount) / 100;
      setAmount(realAmount.toLocaleString("vi-VN") + "đ");
    }
    if (vnpBank) setBankCode(vnpBank);
  }, [searchParams]);

  if (isSuccess === null) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white p-8 md:p-10 rounded-[32px] shadow-[0_10px_40px_-10px_rgba(145,70,30,0.08)] text-center w-full max-w-md border border-gray-100"
      >
        {isSuccess ? (
          <>
            <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-800 mb-2 uppercase tracking-tight">Thanh toán thành công!</h1>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Cảm ơn bạn! Đơn hàng đã được thanh toán trực tuyến qua cổng VNPay.
            </p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-800 mb-2 uppercase tracking-tight">Thanh toán thất bại</h1>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Giao dịch thanh toán không thành công hoặc đã bị hủy bỏ bởi người dùng.
            </p>
          </>
        )}

        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 my-6 text-left space-y-2">
          {orderCode && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-400 font-bold uppercase tracking-wider">Mã đơn hàng:</span>
              <span className="font-black text-primary tracking-widest">{orderCode}</span>
            </div>
          )}
          {amount && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-400 font-bold uppercase tracking-wider">Số tiền:</span>
              <span className="font-extrabold text-gray-800">{amount}</span>
            </div>
          )}
          {bankCode && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-400 font-bold uppercase tracking-wider">Ngân hàng:</span>
              <span className="font-extrabold text-gray-800">{bankCode}</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Link
            href="/orders"
            className="block w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary/90 transition-all text-sm text-center shadow-md shadow-primary/10"
          >
            Lịch sử mua hàng
          </Link>
          <Link
            href="/"
            className="block w-full bg-gray-50 text-gray-600 py-4 rounded-xl font-bold hover:bg-gray-100 transition-colors border border-gray-200 text-sm text-center flex items-center justify-center gap-2"
          >
            Quay lại trang chủ <ArrowRight size={16} />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    }>
      <PaymentResultContent />
    </Suspense>
  );
}
