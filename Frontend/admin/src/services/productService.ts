import { apiClient } from '../lib/api';

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  price: number;
  isAvailable: boolean;
  isFeatured: boolean;
  displayOrder: number;
  toppingIds?: string[];
  toppings?: any[];
  createdAt: string;
  updatedAt: string;
}

export const productService = {
  getAllProducts: async (): Promise<Product[]> => {
    const response = await apiClient.get('/products');
    return response.data.data || response.data;
  },

  getProductById: async (id: string): Promise<Product> => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data.data || response.data;
  },

  createProduct: async (data: Partial<Product>): Promise<Product> => {
    const response = await apiClient.post('/products', data);
    return response.data.data || response.data;
  },

  updateProduct: async (id: string, data: Partial<Product>): Promise<Product> => {
    const response = await apiClient.put(`/products/${id}`, data);
    return response.data.data || response.data;
  },

  deleteProduct: async (id: string): Promise<any> => {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  }
};
