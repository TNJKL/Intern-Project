"use client";

import React from "react";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

// 🌟 CHUẨN HÓA TYPE: Khai báo interface rõ ràng theo đúng đặc tả Layout của Next.js 16
interface AuthLayoutProps {
    children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
    const router = useRouter();

    return (
        <div className="min-h-[100dvh] relative grid place-items-center py-8 px-4 overflow-x-hidden font-sans">
            <style dangerouslySetInnerHTML={{
                __html: `
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 1000px #1d130c inset !important;
            -webkit-text-fill-color: #ffffff !important;
            caret-color: #ffffff !important;
        }
      `}} />

            {/* Background cố định - Không bị load lại khi chuyển trang */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/images/register-premium-bg.png"
                    alt="Background"
                    fill
                    className="object-cover brightness-50"
                    priority
                />
            </div>

            {/* Khung kính Container chung */}
            <div className="w-full max-w-[440px] relative z-10 overflow-hidden bg-black/20 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl">
                <div className="p-8 md:p-10 relative">

                    <button
                        type="button"
                        onClick={() => router.push("/")}
                        className="inline-flex items-center gap-2 text-xs font-semibold text-white/60 hover:text-white transition-colors mb-4 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Về trang chủ
                    </button>

                    {/* Nội dung thay đổi giữa Login và Register */}
                    <div className="relative w-full overflow-hidden">
                        {children}
                    </div>

                </div>
            </div>
        </div>
    );
}