"use client";

import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

interface Product {
  id: string;
  name: string;
  price: number;
}

export default function ProductDetailClient({ product }: { product: Product }) {
  const [selectedSize, setSelectedSize] = useState("M");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    setIsAdding(true);
    // TODO: Gọi API thêm vào giỏ hàng khi có Backend
    await new Promise((r) => setTimeout(r, 600));
    toast.success(`Đã thêm ${product.name} (${selectedSize}) vào giỏ hàng!`);
    setIsAdding(false);
  };

  return (
    <div>
      <div className="mb-8">
        <h3 className="font-bold text-gray-800 mb-3 text-sm">Kích thước</h3>
        <div className="flex gap-3">
          {['S', 'M', 'L'].map((size) => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center font-bold transition-all text-sm ${
                selectedSize === size
                  ? 'border-primary text-primary bg-primary/10'
                  : 'border-gray-100 hover:border-primary/50 hover:text-primary/70'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleAddToCart}
        disabled={isAdding}
        className="w-full bg-primary text-white py-3.5 rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-primary/20 hover:bg-coffee-dark transition-all disabled:opacity-70 text-sm"
      >
        {isAdding ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
          />
        ) : (
          <ShoppingCart className="w-6 h-6" />
        )}
        {isAdding ? "Đang thêm..." : "Thêm vào giỏ hàng"}
      </motion.button>
    </div>
  );
}
