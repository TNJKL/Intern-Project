import Cookies from 'js-cookie';
import { useAuthStore } from '../store/useAuthStore';

export const fileService = {
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'products');

    const token = useAuthStore.getState().accessToken || Cookies.get('adminAccessToken');
    
    // Sử dụng fetch thay vì axios để tận dụng khả năng xử lý stream tốt hơn của trình duyệt
    const response = await fetch('/api/v1/storage/images', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true',
        // KHÔNG set Content-Type để trình duyệt tự tạo boundary cho multipart/form-data
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Upload thất bại: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Tìm kiếm sâu (deep search) chuỗi bắt đầu bằng 'http' trong bất kỳ key nào của response
    const searchHttp = (val: any): string => {
      if (typeof val === 'string' && val.startsWith('http')) return val;
      if (Array.isArray(val)) {
        for (const item of val) {
          const res = searchHttp(item);
          if (res) return res;
        }
      } else if (val && typeof val === 'object') {
        for (const key in val) {
          const res = searchHttp(val[key]);
          if (res) return res;
        }
      }
      return '';
    };

    const foundUrl = searchHttp(data);
    if (foundUrl) return foundUrl;

    console.error('Toàn bộ response từ backend:', data);
    throw new Error('Backend không trả về link ảnh hợp lệ!');
  },
};
