import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';

// Store tồn tại trong RAM, reset khi tải lại trang (đây là hành vi mong muốn cho accessToken)
export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

// Gán vào window để debug (chỉ dùng trong lúc dev)
if (typeof window !== 'undefined') {
  (window as any).store = store;
}

// Typed hooks
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
