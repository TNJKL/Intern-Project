"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, MapPin, CreditCard, CheckCircle2, Truck } from "lucide-react";
import { motion } from "framer-motion";
import { useCartStore } from "@/store/useCartStore";
import { orderService } from "@/services/order.service";
import toast from "react-hot-toast";

export default function CheckoutClient() {
  const { items: cartItems, clearCart } = useCartStore();
  const [mounted, setMounted] = useState(false);
  
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const subTotal = cartItems.reduce((total, item) => total + (item.unitPrice * item.quantity), 0);
  const shippingFee = 15000;
  const discount = 0; // Tương lai có thể map voucher vào đây
  const total = Math.max(0, subTotal + shippingFee - discount);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      toast.error("Giỏ hàng của bạn đang trống!");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        userPhone: phone,
        deliveryAddress: address,
        paymentMethod: paymentMethod,
        note: note,
        items: cartItems.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          toppingIds: item.toppingIds,
        }))
      };
      
      await orderService.createOrder(payload);
      clearCart();
      setIsSuccess(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi đặt hàng.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return <div className="min-h-screen bg-[#fcf9f2]"></div>;

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#fcf9f2] flex flex-col items-center justify-center p-6 pb-32">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-8 md:p-12 rounded-[40px] shadow-xl text-center max-w-md w-full border border-gray-100"
        >
          <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black text-gray-800 mb-2 uppercase">Đặt hàng thành công!</h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đang được xử lý và sẽ sớm giao những ly cà phê tuyệt hảo đến tay bạn.
          </p>
          
          <div className="space-y-3">
            <Link href="/orders" className="block w-full bg-primary text-white py-4 rounded-2xl font-bold hover:bg-coffee-dark transition-colors">
              Theo dõi đơn hàng
            </Link>
            <Link href="/" className="block w-full bg-gray-50 text-gray-600 py-4 rounded-2xl font-bold hover:bg-gray-100 transition-colors border border-gray-200">
              Về trang chủ
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcf9f2] pb-32">
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/cart" className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tight">Thanh toán</h1>
        </div>

        <form onSubmit={handleCheckout} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Thông tin giao hàng */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-transparent hover:border-gray-100 transition-colors">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-xl font-black text-gray-800 uppercase">Thông tin giao hàng</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 block">Số điện thoại</label>
                  <input 
                    required 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Nhập số điện thoại" 
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all" 
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-gray-700 block">Địa chỉ nhận hàng</label>
                  <input 
                    required 
                    type="text" 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện..." 
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all" 
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-gray-700 block">Ghi chú (Tùy chọn)</label>
                  <textarea 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ghi chú thêm cho quán (ví dụ: ít đá, không đường...)" 
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all resize-none h-24"
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Phương thức thanh toán */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-transparent hover:border-gray-100 transition-colors">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-xl font-black text-gray-800 uppercase">Phương thức thanh toán</h2>
              </div>
              
              <div className="space-y-3">
                <label className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-primary/30'}`}>
                  <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="w-5 h-5 accent-primary" />
                  <div className="flex-1 flex items-center gap-3">
                    <Truck className="w-6 h-6 text-gray-600" />
                    <div>
                      <p className="font-bold text-gray-800">Thanh toán khi nhận hàng (COD)</p>
                      <p className="text-xs text-gray-500">Thanh toán bằng tiền mặt khi shipper giao hàng.</p>
                    </div>
                  </div>
                </label>

                <label className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${paymentMethod === 'vnpay' ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-primary/30'}`}>
                  <input type="radio" name="payment" value="vnpay" checked={paymentMethod === 'vnpay'} onChange={() => setPaymentMethod('vnpay')} className="w-5 h-5 accent-primary" />
                  <div className="flex-1 flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center font-black text-[10px]">VN</div>
                    <div>
                      <p className="font-bold text-gray-800">Ví VNPay / Thẻ ngân hàng</p>
                      <p className="text-xs text-gray-500">Chuyển hướng đến cổng thanh toán VNPay.</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Đơn hàng (Order Summary readonly) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-6 shadow-sm sticky top-24">
              <h3 className="text-lg font-black text-gray-800 uppercase mb-4">Đơn hàng của bạn</h3>
              
              <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-start">
                    <div className="flex-1 pr-4">
                      <p className="font-bold text-sm text-gray-800">{item.quantity}x {item.name}</p>
                      <p className="text-xs text-gray-500">Size {item.sizeLabel}</p>
                      {item.toppings.length > 0 && (
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          + {item.toppings.map(t => t.name).join(", ")}
                        </p>
                      )}
                    </div>
                    <span className="font-bold text-sm text-gray-800 shrink-0">{(item.unitPrice * item.quantity).toLocaleString('vi-VN')}đ</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3 text-sm font-medium text-gray-500 border-t border-gray-100 pt-6 mb-6">
                <div className="flex justify-between">
                  <span>Tạm tính</span>
                  <span className="text-gray-800 font-bold">{subTotal.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí giao hàng</span>
                  <span className="text-gray-800 font-bold">{shippingFee.toLocaleString('vi-VN')}đ</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Khuyến mãi</span>
                    <span className="font-bold">-{discount.toLocaleString('vi-VN')}đ</span>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-6 mb-8">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-gray-500 uppercase">Tổng thanh toán</span>
                  <span className="text-2xl font-black text-primary">
                    {total.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting || cartItems.length === 0}
                className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-coffee-dark shadow-lg shadow-primary/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Đang xử lý..." : "Đặt Hàng Ngay"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
