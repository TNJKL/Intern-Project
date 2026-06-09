"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Coffee, ShoppingBag } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export function Hero() {
  const [steamEffect, setSteamEffect] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const syncSteam = () => {
      const savedSteam = localStorage.getItem("steamEffect") === "true";
      setSteamEffect(savedSteam);
    };

    if (typeof window !== "undefined") {
      syncSteam();
      window.addEventListener("steamEffectChanged", syncSteam);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("steamEffectChanged", syncSteam);
      }
    };
  }, []);

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#2a1b12] via-[#3c2a21] to-[#1a120b]">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/login-bg.jpg" // Using the existing login-bg for coffee atmosphere
          alt="Coffee background"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-20 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a120b] via-transparent to-transparent"></div>
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] bg-primary/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-1/4 w-[30vw] h-[30vw] bg-[#ff9b5a]/10 blur-[100px] rounded-full pointer-events-none translate-x-1/2 translate-y-1/2"></div>
      </div>

      <div className="relative z-10 px-6 py-20 md:py-32 max-w-5xl mx-auto w-full text-center flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 mb-8 mt-4"
        >
          {/* Ly bốc khói cỡ lớn */}
          <div className="relative">
            <div className="bg-primary text-white p-4 sm:p-6 rounded-[28px] sm:rounded-[36px] shadow-2xl shadow-primary/40">
              {/* Sử dụng SVG tuỳ chỉnh để ẩn khói tĩnh khi tắt hiệu ứng */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-12 h-12 sm:w-20 sm:h-20"
              >
                <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
                <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                <line x1="2" y1="22" x2="22" y2="22" />
                {isMounted && steamEffect && (
                  <>
                    <line x1="6" y1="2" x2="6" y2="4" />
                    <line x1="10" y1="2" x2="10" y2="4" />
                    <line x1="14" y1="2" x2="14" y2="4" />
                  </>
                )}
              </svg>
            </div>
            {isMounted && steamEffect && (
              <div className="absolute -top-10 sm:-top-16 left-1/2 -translate-x-1/2 flex gap-2 sm:gap-3.5 pointer-events-none z-20">
                <span className="w-[2.5px] sm:w-[3.5px] h-8 sm:h-14 bg-white/70 rounded-full steam-line steam-line-1 shadow-[0_0_8px_rgba(255,255,255,0.4)]"></span>
                <span className="w-[2.5px] sm:w-[3.5px] h-11 sm:h-19 bg-[#ffbe94] rounded-full steam-line steam-line-2 shadow-[0_0_10px_rgba(255,190,148,0.6)]"></span>
                <span className="w-[2.5px] sm:w-[3.5px] h-8 sm:h-14 bg-white/70 rounded-full steam-line steam-line-3 shadow-[0_0_8px_rgba(255,255,255,0.4)]"></span>
              </div>
            )}
          </div>

          {/* Tên thương hiệu cỡ lớn thay thế tiêu đề chính */}
          <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black uppercase tracking-tight md:tracking-wider leading-none drop-shadow-2xl flex flex-col md:flex-row items-center">
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70">Brew</span>
            <span className="text-primary bg-none bg-clip-border drop-shadow-[0_0_35px_rgba(211,117,51,0.6)]">tra</span>
          </h1>
        </motion.div>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="text-white/60 max-w-2xl mx-auto font-medium leading-relaxed text-base md:text-lg lg:text-xl mb-12"
        >
          Đánh thức mọi giác quan của bạn với những hạt cà phê tuyển chọn và sự tinh tế trong từng giọt pha chế. Khám phá thực đơn đặc biệt của chúng tôi ngay hôm nay.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          <Link 
            href="/menu" 
            className="w-full sm:w-auto group relative flex items-center justify-center gap-3 px-8 py-4 bg-primary text-white font-black uppercase tracking-wider rounded-full overflow-hidden shadow-[0_0_40px_-10px_rgba(211,117,51,0.8)] hover:scale-105 active:scale-95 transition-all duration-300"
          >
            <span className="relative z-10 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              Đặt Hàng Ngay
            </span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
          </Link>
          
          <Link 
            href="/#categories" 
            className="w-full sm:w-auto group flex items-center justify-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold uppercase tracking-wider rounded-full backdrop-blur-sm transition-all duration-300 hover:border-white/30"
          >
            Khám Phá Menu
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
      
      {/* Decorative Bottom Fade for seamless transition to next section */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#fdfaf5] to-transparent z-10 pointer-events-none"></div>
    </section>
  );
}
