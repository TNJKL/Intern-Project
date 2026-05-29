/**
 * Cấu hình API tập trung cho toàn bộ project Client.
 * Nếu muốn đổi IP Backend, chỉ cần đổi tại file .env ở gốc dự án 
 * hoặc biến NEXT_PUBLIC_GLOBAL_BACKEND_IP.
 */

export const API_CONFIG = {
  // Ưu tiên biến môi trường, nếu không có mới dùng fallback
  BASE_URL: process.env.NEXT_PUBLIC_GLOBAL_BACKEND_IP || '10.86.156.23',

  // Các endpoint dùng chung
  ENDPOINTS: {
    PRODUCTS: '/api/v1/products',
    CATEGORIES: '/api/v1/categories',
    SUGGESTIONS: '/api/v1/products/suggest',
    AUTH: {
      LOGIN: '/api/v1/auth/login',
      REFRESH: '/api/v1/auth/refresh',
    }
  }
};
