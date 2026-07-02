"use client";

import React from "react";
import toast from "react-hot-toast";

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

export function InfoRow({ icon, label, value }: InfoRowProps) {
  const handleCopy = () => {
    if (!value || value === "Chưa cập nhật") return;
    navigator.clipboard.writeText(value);
    toast.success(`Đã sao chép ${label.toLowerCase()}!`);
  };

  const isCopyable = value && value !== "Chưa cập nhật";

  return (
    <div
      onClick={handleCopy}
      title={isCopyable ? `${value} (Click để sao chép)` : ""}
      className={`flex items-center gap-4 p-3 rounded-lg hover:bg-primary/5 transition-all duration-200 group ${
        isCopyable ? "cursor-pointer active:scale-[0.98]" : ""
      }`}
    >
      <div className="w-11 h-11 rounded bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300 shrink-0">
        {React.cloneElement(icon as any, { size: 18 })}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">{label}</p>
        <p className="text-base font-bold text-gray-800 truncate">{value}</p>
      </div>
    </div>
  );
}
