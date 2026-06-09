"use client";

import React, { useState } from 'react';
import { MessageCircle, X, Send, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    console.log("Sending message:", message);
    setMessage("");
  };

  return (
    <div className="fixed bottom-[96px] right-3 lg:bottom-8 lg:right-8 z-[100]">
      {/* bottom-[96px] trên mobile: nằm trên bottom floating nav; bottom-8 trên desktop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9, transformOrigin: "bottom right" }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-[60px] lg:bottom-[80px] right-0 w-[320px] sm:w-[400px] h-[450px] sm:h-[500px] bg-white rounded-[24px] sm:rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden border border-gray-100"
          >
            {/* Header */}
            <div className="bg-primary p-4 sm:p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center">
                  <User className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h4 className="font-black text-xs sm:text-sm uppercase tracking-wider">Hỗ trợ Brewtra</h4>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-bold opacity-80">Trực tuyến</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1.5 sm:p-2 rounded-full transition-colors">
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-[#fdfaf5]/50 flex flex-col gap-4">
              <div className="flex flex-col gap-1 max-w-[85%]">
                <div className="bg-white p-3.5 sm:p-4 rounded-2xl rounded-bl-none shadow-sm border border-gray-100">
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium">
                    Chào bạn! Brewtra có thể giúp gì cho bạn hôm nay không? ☕
                  </p>
                </div>
                <span className="text-[9px] font-bold text-gray-400 ml-2">10:00 AM</span>
              </div>

              {/* Placeholder for "Nhân viên đang trả lời" */}
              <div className="flex items-center gap-2 text-gray-400 italic text-[10px] font-medium ml-2">
                <div className="flex gap-1">
                  <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></span>
                  <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
                Nhân viên đang trả lời...
              </div>
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 sm:p-4 bg-white border-t border-gray-100 flex items-center gap-3">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Nhập tin nhắn..."
                className="flex-1 bg-gray-50 border-none rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <button 
                type="submit"
                className="w-9 h-9 sm:w-10 sm:h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
              >
                <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 lg:w-16 lg:h-16 bg-primary text-white rounded-full flex items-center justify-center shadow-[0_10px_20px_-5px_rgba(211,117,51,0.35)] lg:shadow-[0_15px_30px_-5px_rgba(211,117,51,0.4)] hover:scale-110 active:scale-95 transition-all duration-300 group"
      >
        <div className="relative">
          <MessageCircle className="w-6 h-6 lg:w-8 lg:h-8" />
          {!isOpen && (
            <div className="absolute -top-0.5 -right-0.5 lg:-top-1 lg:-right-1 w-3 h-3 lg:w-4 lg:h-4 bg-red-500 border-2 border-primary rounded-full"></div>
          )}
        </div>
      </button>
    </div>
  );
}
