// 📄 Vị trí file: src/store/zustand/authStore.ts (hoặc đường dẫn hiện tại của bạn)
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '../../types/user';

/**
 * Zustand store chỉ lưu thông tin User (tên, email...).
 * accessToken được quản lý bởi Redux (RAM only).
 * refreshToken được quản lý bởi Backend qua httpOnly Cookie.
 * Dữ liệu được lưu tại sessionStorage (Xóa khi đóng Tab/Trình duyệt).
 */
interface UserState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  setUser: (user: User | null, accessToken?: string | null) => void;
  setHasHydrated: (state: boolean) => void;
  clearUser: () => void;
}

export const useAuthStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setUser: (user, accessToken) => set((state) => ({
        user,
        accessToken: accessToken !== undefined ? accessToken : state.accessToken,
        isAuthenticated: !!user,
      })),

      setHasHydrated: (state) => set({ _hasHydrated: state }),

      clearUser: () => set({ user: null, accessToken: null, isAuthenticated: false }),
    }),
    {
      name: 'user-auth-storage', // 🎯 Tên key mới lưu trong localStorage chung
      storage: createJSONStorage(() => localStorage), // 🎯 Chuyển sang localStorage để chia sẻ dữ liệu giữa các tab
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }), // Chỉ persist user, accessToken và isAuthenticated
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);