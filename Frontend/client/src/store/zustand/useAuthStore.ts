// 📄 Vị trí file: src/store/zustand/authStore.ts (hoặc đường dẫn hiện tại của bạn)
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '../../types/user';

// Dọn dẹp dữ liệu cũ trong localStorage nếu còn sót lại từ phiên bản trước
if (typeof window !== 'undefined') {
  localStorage.removeItem('user-storage');
}

/**
 * Zustand store chỉ lưu thông tin User (tên, email...).
 * accessToken được quản lý bởi Redux (RAM only).
 * refreshToken được quản lý bởi Backend qua httpOnly Cookie.
 * Dữ liệu được lưu tại sessionStorage (Xóa khi đóng Tab/Trình duyệt).
 */
interface UserState {
  user: User | null;
  _hasHydrated: boolean;
  setUser: (user: User | null) => void;
  setHasHydrated: (state: boolean) => void;
  clearUser: () => void;
}

export const useAuthStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      _hasHydrated: false,

      setUser: (user) => set({ user }),

      setHasHydrated: (state) => set({ _hasHydrated: state }),

      clearUser: () => set({ user: null }),
    }),
    {
      name: 'user-session-storage', // 🎯 Đổi tên key để tránh xung đột với data localStorage cũ
      storage: createJSONStorage(() => sessionStorage), // 🎯 Thay đổi từ localStorage sang sessionStorage tại đây
      partialize: (state) => ({ user: state.user }), // Chỉ persist duy nhất user object
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);