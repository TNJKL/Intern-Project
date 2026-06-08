import { apiClient } from '../lib/api';

export const fileService = {
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'products');

    console.log('[DEBUG] Starting image upload...');

    try {
      const response = await apiClient.post('/storage/images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'ngrok-skip-browser-warning': 'true',
        }
      });

      const data = response.data;
      console.log('[DEBUG] Upload success, response:', data);

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
    } catch (error: any) {
      console.error('[DEBUG] Upload failed error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Lỗi không xác định';
      throw new Error(`Upload thất bại: ${errorMessage}`);
    }
  },
};
