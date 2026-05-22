import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartTopping {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  id: string; // Unique local identifier (e.g., productId-variantId-toppings)
  productId: string;
  variantId: string;
  quantity: number;
  toppingIds: string[];
  
  // UI Display Fields
  name: string;
  image: string;
  category: string;
  sizeLabel: string;
  toppings: CartTopping[];
  unitPrice: number; // variant price + toppings price
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
}

import { useAuthStore } from './useAuthStore';
import { StateStorage, createJSONStorage } from 'zustand/middleware';

// Generate a unique ID based on product, variant, and toppings
const generateItemId = (productId: string, variantId: string, toppingIds: string[]) => {
  return `${productId}-${variantId}-${[...toppingIds].sort().join(',')}`;
};

// Custom Storage để phân tách giỏ hàng theo User ID (hoặc guest) trong localStorage
const customStorage: StateStorage = {
  getItem: (name) => {
    if (typeof window === 'undefined') return null;
    const userId = useAuthStore.getState().user?.id || 'guest';
    const key = `${name}-${userId}`;
    return localStorage.getItem(key);
  },
  setItem: (name, value) => {
    if (typeof window === 'undefined') return;
    const userId = useAuthStore.getState().user?.id || 'guest';
    const key = `${name}-${userId}`;
    localStorage.setItem(key, value);
  },
  removeItem: (name) => {
    if (typeof window === 'undefined') return;
    const userId = useAuthStore.getState().user?.id || 'guest';
    const key = `${name}-${userId}`;
    localStorage.removeItem(key);
  },
};

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      
      addItem: (newItem) => set((state) => {
        const id = generateItemId(newItem.productId, newItem.variantId, newItem.toppingIds);
        const existingItem = state.items.find(item => item.id === id);
        
        if (existingItem) {
          // If identical item exists, just increase quantity
          return {
            items: state.items.map(item => 
              item.id === id 
                ? { ...item, quantity: item.quantity + newItem.quantity }
                : item
            )
          };
        }
        
        return {
          items: [...state.items, { ...newItem, id }]
        };
      }),
      
      removeItem: (id) => set((state) => ({
        items: state.items.filter(item => item.id !== id)
      })),
      
      updateQuantity: (id, delta) => set((state) => ({
        items: state.items.map(item => {
          if (item.id === id) {
            const newQuantity = Math.max(1, item.quantity + delta);
            return { ...item, quantity: newQuantity };
          }
          return item;
        })
      })),
      
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'brewtra-cart-storage',
      storage: createJSONStorage(() => customStorage),
    }
  )
);

// Tự động đồng bộ giỏ hàng khi trạng thái đăng nhập thay đổi (Login / Logout)
if (typeof window !== 'undefined') {
  let currentUser = useAuthStore.getState().user;
  
  useAuthStore.subscribe((state) => {
    const newUser = state.user;
    if (newUser?.id !== currentUser?.id) {
      currentUser = newUser;
      const userId = newUser?.id || 'guest';
      const key = `brewtra-cart-storage-${userId}`;
      const savedCart = localStorage.getItem(key);
      if (savedCart) {
        try {
          const parsed = JSON.parse(savedCart);
          if (parsed && parsed.state) {
            useCartStore.setState({ items: parsed.state.items || [] });
          } else {
            useCartStore.setState({ items: [] });
          }
        } catch (e) {
          useCartStore.setState({ items: [] });
        }
      } else {
        useCartStore.setState({ items: [] });
      }
    }
  });
}
