// 📄 Vị trí file: src/lib/api-config.ts

export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_GLOBAL_BACKEND_IP || 'http://localhost:8080',
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