"use client";

import React, { useState, useEffect, useCallback } from "react";
import { SafeImage } from "@/components/SafeImage";
import { Coffee, X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ProductImageGalleryProps {
  imageUrl?: string;
  additionalImageUrls?: string[];
  name: string;
}

export default function ProductImageGallery({
  imageUrl,
  additionalImageUrls = [],
  name,
}: ProductImageGalleryProps) {
  // Combine all images and filter out empty / duplicates
  const images = React.useMemo(() => {
    return Array.from(new Set([imageUrl, ...additionalImageUrls].filter(Boolean))) as string[];
  }, [imageUrl, additionalImageUrls]);

  const [activeImage, setActiveImage] = useState<string>("");
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);

  // Sync activeImage with prop updates
  useEffect(() => {
    if (images.length > 0) {
      setActiveImage(images[0]);
    } else {
      setActiveImage("");
    }
  }, [images]);

  // Navigate lightbox images
  const handlePrev = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLightboxIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const handleNext = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLightboxIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen) return;
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "Escape") setIsLightboxOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, handlePrev, handleNext]);

  const openLightbox = () => {
    const idx = images.indexOf(activeImage);
    setLightboxIndex(idx >= 0 ? idx : 0);
    setIsLightboxOpen(true);
  };

  if (images.length === 0) {
    return (
      <div className="aspect-square rounded-lg bg-gray-50 border border-gray-100 flex flex-col items-center justify-center text-gray-200 w-full relative">
        <Coffee className="w-20 h-20 mb-3 text-gray-300" />
        <span className="text-xs font-bold uppercase tracking-widest text-gray-300">
          Chưa có ảnh
        </span>
      </div>
    );
  }

  return (
    <div className="w-full lg:grow flex flex-col justify-between gap-4">
      {/* Main Image View */}
      <div
        onClick={openLightbox}
        className="group relative aspect-square rounded-xl bg-white border border-gray-100 flex items-center justify-center overflow-hidden cursor-zoom-in shadow-sm hover:shadow-md transition-all duration-300"
      >
        <SafeImage
          src={activeImage}
          alt={name}
          fill
          priority
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 1024px) 100vw, (max-width: 1280px) 380px, 450px"
          fallback={
            <div className="flex flex-col items-center justify-center text-gray-200 w-full h-full bg-gray-50">
              <Coffee className="w-20 h-20 mb-3 text-gray-300" />
              <span className="text-xs font-bold uppercase tracking-widest text-gray-300">
                Lỗi tải ảnh
              </span>
            </div>
          }
        />
        {/* Zoom Overlay on Hover */}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            <ZoomIn className="w-6 h-6 text-coffee-dark" />
          </div>
        </div>
      </div>

      {/* Thumbnails list (Only show if > 1 image) */}
      {images.length > 1 && (
        <div className="flex flex-wrap gap-2.5 pt-1 justify-start">
          {images.map((imgUrl, index) => {
            const isActive = imgUrl === activeImage;
            return (
              <button
                key={index}
                type="button"
                onClick={() => setActiveImage(imgUrl)}
                className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border transition-all duration-300 shadow-sm ${
                  isActive
                    ? "border-2 border-coffee-dark scale-105 shadow-md z-10 opacity-100"
                    : "border-gray-200/60 opacity-60 hover:opacity-100 hover:border-coffee-dark/40 bg-stone-50/40"
                }`}
              >
                <SafeImage
                  src={imgUrl}
                  alt={`${name} thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
                {isActive && (
                  <div className="absolute inset-0 bg-coffee-dark/5 pointer-events-none" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsLightboxOpen(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 sm:p-8"
          >
            {/* Top Control Bar */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-[110]">
              <span className="text-white/80 text-sm font-semibold select-none">
                {lightboxIndex + 1} / {images.length}
              </span>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
                aria-label="Close lightbox"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Main Content Area */}
            <div className="relative w-full max-w-4xl max-h-[80vh] flex items-center justify-center">
              {/* Previous Button */}
              {images.length > 1 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-0 sm:-left-16 z-[110] p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              {/* Enlarged Image container with zoom in/out effect */}
              <motion.div
                key={lightboxIndex}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                onClick={(e) => e.stopPropagation()}
                className="relative aspect-square w-full max-w-[90vw] sm:max-w-[75vh] max-h-[75vh] rounded-lg overflow-hidden bg-white/5"
              >
                <SafeImage
                  src={images[lightboxIndex]}
                  alt={`${name} detail`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 1000px"
                />
              </motion.div>

              {/* Next Button */}
              {images.length > 1 && (
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-0 sm:-right-16 z-[110] p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Thumbnail strip in Lightbox */}
            {images.length > 1 && (
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[90vw] p-1.5 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
                {images.map((imgUrl, idx) => {
                  const isActive = idx === lightboxIndex;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxIndex(idx);
                      }}
                      className={`relative w-12 h-12 rounded-lg overflow-hidden border transition-all duration-200 shrink-0 ${
                        isActive
                          ? "border-white scale-105"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <SafeImage
                        src={imgUrl}
                        alt={`lightbox thumbnail ${idx + 1}`}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
