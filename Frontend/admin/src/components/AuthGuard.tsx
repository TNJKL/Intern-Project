import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, setAuth, fetchUser } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Wait for zustand persist to hydrate
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    // Check for auth data in URL (passed from client login)
    const urlParams = new URLSearchParams(window.location.search);
    const authDataParam = urlParams.get('auth');

    if (authDataParam) {
      try {
        const authData = JSON.parse(decodeURIComponent(authDataParam));
        setAuth(authData.user, authData.accessToken, authData.refreshToken);
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
        return; // Don't redirect if we just authenticated
      } catch (e) {
        console.error('Failed to parse auth data', e);
      }
    }

    // If authenticated, fetch latest profile to prevent data loss
    if (isAuthenticated) {
      fetchUser();
    }

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      window.location.href = 'http://localhost:3000/login?logout=true';
      return;
    }

    // If authenticated but NOT an admin, redirect to client homepage
    if (user && user.role !== 'ADMIN') {
      window.location.href = 'http://localhost:3000';
      return;
    }
  }, [isHydrated, isAuthenticated, setAuth, fetchUser]);

  // Show loading while hydrating or redirecting
  if (!isHydrated || !isAuthenticated || user?.role !== 'ADMIN') {
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
