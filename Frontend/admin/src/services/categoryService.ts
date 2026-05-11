import { apiClient } from '../lib/api';

export interface Category {
  id: string;
  name: string;
  slug: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  description?: string; // Optional for UI mapping
  productCount?: number; // Optional for UI mapping
  imageUrl?: string; 
}

export const categoryService = {
  getAllCategories: async (): Promise<Category[]> => {
    // Gọi đúng path /categories (baseURL đã có /api/v1)
    const response = await apiClient.get('/categories');
    return response.data.data || response.data;
  },

  getCategoryById: async (id: string): Promise<Category> => {
    const response = await apiClient.get(`/categories/${id}`);
    return response.data.data || response.data;
  },

  createCategory: async (data: Partial<Category>): Promise<Category> => {
    const response = await apiClient.post('/categories', data);
    return response.data.data || response.data;
  },

  updateCategory: async (id: string, data: Partial<Category>): Promise<Category> => {
    const response = await apiClient.put(`/categories/${id}`, data);
    return response.data.data || response.data;
  },

  deleteCategory: async (id: string): Promise<void> => {
    await apiClient.delete(`/categories/${id}`);
  }
};
