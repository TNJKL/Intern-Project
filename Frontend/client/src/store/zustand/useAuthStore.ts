import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '../../types/user';

/**
 * Zustand store chỉ lưu thông tin User (tên, email...).
 * accessToken được quản lý bởi Redux (RAM only).
 * refreshToken được quản lý bởi Backend qua httpOnly Cookie.
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
      name: 'user-storage', // Chỉ lưu user info (tên, email) — không phải token
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user }), // Chỉ persist user object
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
