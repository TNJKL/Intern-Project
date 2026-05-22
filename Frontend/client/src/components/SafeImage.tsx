"use client";

import React, { useState, useEffect } from "react";
import Image, { ImageProps } from "next/image";
import { Coffee } from "lucide-react";

interface SafeImageProps extends Omit<ImageProps, "onError"> {
  fallback?: React.ReactNode;
}

export function SafeImage({ src, alt, fallback, unoptimized, ...props }: SafeImageProps) {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [src]);

  let finalSrc = src;
  let isUnoptimized = unoptimized;

  if (typeof src === "string") {
    if (src.includes("bartender.edu.vn")) {
      // Dead link for boba tea -> replace with high-quality boba photo from Unsplash
      finalSrc = "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=60";
      isUnoptimized = true;
    } else if (src.includes("paperandtea.com")) {
      // 404 dead link -> replace with a premium, beautiful organic herbal tea photo from Unsplash
      finalSrc = "https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=500&auto=format&fit=crop&q=60";
      isUnoptimized = true;
    }
  }

  if (error || !finalSrc) {
    return (
      fallback || (
        <div className="flex flex-col items-center justify-center w-full h-full bg-gray-50 text-primary/20 p-4">
          <Coffee className="w-10 h-10 mb-1" />
          <span className="text-[10px] font-black uppercase tracking-wider">No Image</span>
        </div>
      )
    );
  }

  return (
    <Image
      src={finalSrc}
      alt={alt}
      onError={() => setError(true)}
      unoptimized={isUnoptimized}
      {...props}
    />
  );
}
