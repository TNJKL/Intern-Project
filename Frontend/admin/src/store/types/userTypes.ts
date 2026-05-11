import type { User } from '@/types/user';

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  
  setAuth: (data: { user: User; accessToken: string; refreshToken: string }) => void;
  clearAuth: () => void;
  setHasHydrated: (state: boolean) => void;
  updateUser: (user: Partial<User>) => void;
}
