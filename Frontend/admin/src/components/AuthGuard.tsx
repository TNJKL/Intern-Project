import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/zustand/useAuthStore';

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, setAuth, fetchUser, silentRefresh } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Wait for zustand persist to hydrate
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated || !isCheckingAuth) return;

    const checkAuth = async () => {
      // 1. Check for auth data in URL (passed from client login)
      const urlParams = new URLSearchParams(window.location.search);
      const authDataParam = urlParams.get('auth');

      if (authDataParam) {
        try {
          const authData = JSON.parse(decodeURIComponent(authDataParam));
          setAuth(authData.user, authData.accessToken, authData.refreshToken);
          
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
          setIsCheckingAuth(false);
          return;
        } catch (e) {
          console.error('Failed to parse auth data', e);
        }
      }

      // 2. If not authenticated, try silent refresh
      if (!isAuthenticated) {
        const success = await silentRefresh();
        if (success) {
          setIsCheckingAuth(false);
          return;
        }
        
        // If silent refresh failed, redirect to login
        window.location.href = 'http://localhost:3000/login?logout=true';
        return;
      }

      // 3. If authenticated but NOT an admin, redirect to client homepage
      if (user && user.role?.toUpperCase() !== 'ADMIN') {
        window.location.href = 'http://localhost:3000';
        return;
      }

      // 4. Fetch latest profile
      try {
        await fetchUser();
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
      }
      
      setIsCheckingAuth(false);
    };

    checkAuth();
  }, [isHydrated, isCheckingAuth, isAuthenticated, setAuth, fetchUser, silentRefresh, user]);

  // Show loading while hydrating or redirecting
  if (!isHydrated || isCheckingAuth || user?.role?.toUpperCase() !== 'ADMIN') {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#fdfaf5]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="font-bold text-coffee-dark uppercase tracking-widest text-sm">Đang bảo mật kết nối...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
