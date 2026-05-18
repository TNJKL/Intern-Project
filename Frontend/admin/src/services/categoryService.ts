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

export interface Page<T> {
  data: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const categoryService = {
  getAllCategories: async (params?: { 
    page?: number; 
    size?: number; 
    keyword?: string;
    includeDeleted?: boolean;
    sortBy?: string;
    sortDirection?: string;
    sort?: string;
  }): Promise<Page<Category> | Category[]> => {
    const { sortBy, sortDirection, ...rest } = params || {};
    const sort = sortBy ? `${sortBy},${sortDirection || 'asc'}` : params?.sort;

    const response = await apiClient.get('/categories', { 
      params: { ...rest, sort } 
    });
    return response.data;
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
  },

  restoreCategory: async (id: string): Promise<void> => {
    await apiClient.post(`/categories/${id}/restore`);
  }
};
