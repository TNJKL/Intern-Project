import React, { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../store/zustand/useAuthStore';
import { message } from '../lib/antd';
import Cookies from 'js-cookie';

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, setAuth, fetchUser, silentRefresh } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  // Ref để đảm bảo checkAuth chỉ chạy đúng 1 lần
  const hasChecked = useRef(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated || hasChecked.current) return;
    hasChecked.current = true;

    const checkAuth = async () => {
      // 1. Kiểm tra dữ liệu auth trong URL (được truyền từ client login)
      const urlParams = new URLSearchParams(window.location.search);
      const authDataParam = urlParams.get('auth');

      if (authDataParam) {
        try {
          const authData = JSON.parse(decodeURIComponent(authDataParam));
          setAuth(authData.user, authData.accessToken);
          message.success('Đăng nhập thành công!');
          window.history.replaceState({}, document.title, window.location.pathname);
          setIsCheckingAuth(false);
          return;
        } catch (e) {
          console.error('[AuthGuard] Failed to parse auth data from URL', e);
        }
      }

      // 2. Kiểm tra có adminAccessToken cookie không
      const adminToken = Cookies.get('adminAccessToken');
      if (adminToken) {
        try {
          await fetchUser();
          const currentUser = useAuthStore.getState().user;
          if (currentUser && currentUser.role?.toUpperCase() === 'ADMIN') {
            setIsCheckingAuth(false);
            return;
          }
        } catch (err) {
          console.error('[AuthGuard] fetchUser thất bại:', err);
        }
      }

      // 3. Không có token hoặc fetchUser thất bại/không có quyền ADMIN → thử silent refresh
      console.log('[AuthGuard] Thử silent refresh...');
      const success = await silentRefresh();
      if (success) {
        const currentUser = useAuthStore.getState().user;
        if (currentUser && currentUser.role?.toUpperCase() === 'ADMIN') {
          setIsCheckingAuth(false);
          return;
        }
      }

      // 4. Thất bại hoặc không đủ quyền ADMIN → về trang login
      console.log('[AuthGuard] Xác thực thất bại hoặc không đủ quyền Admin, chuyển về login');
      Cookies.remove('adminAccessToken', { path: '/' });
      useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false });
      window.location.href = 'http://localhost:3000/login?logout=true';
    };

    checkAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated]);

  // Hiển thị loading trong khi kiểm tra auth
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
