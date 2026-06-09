// 📄 Vị trí file: src/services/ingredient.service.ts
import { apiClient } from '../lib/api';

// 📄 src/services/ingredient.service.ts
export interface Ingredient {
  id: string;
  name: string;
  sku: string;
  unit: string;
  currentStock: number;
  lowStockThreshold: number;
  costPerUnit: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
  deletedAt?: string;
}



export interface Page<T> {
  data: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const ingredientService = {
  getAllIngredients: async (params?: {
    page?: number;
    size?: number;
    keyword?: string;
    name?: string;
    isActive?: boolean;
    includeDeleted?: boolean;
    sort?: string;
    excludeToppings?: boolean;
  }): Promise<any> => {
    const response = await apiClient.get('/admin/ingredients', { params });
    return response.data; // Trả về data chứa phân trang gốc từ Backend
  },

  getIngredientById: async (id: string): Promise<Ingredient> => {
    const response = await apiClient.get(`/admin/ingredients/${id}`);
    return response.data.data || response.data;
  },

  createIngredient: async (data: Partial<Ingredient>): Promise<Ingredient> => {
    const response = await apiClient.post('/admin/ingredients', data);
    return response.data.data || response.data;
  },

  updateIngredient: async (id: string, data: Partial<Ingredient>): Promise<Ingredient> => {
    const { currentStock, id: dataId, ...updatePayload } = data as any;
    const response = await apiClient.patch(`/admin/ingredients/${id}`, updatePayload);
    return response.data.data || response.data;
  },

  deleteIngredient: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/ingredients/${id}`);
  },

  restoreIngredient: async (id: string): Promise<void> => {
    await apiClient.post(`/admin/ingredients/${id}/restore`);
  },

  restockIngredient: async (id: string, payload: { quantity: number; note?: string }): Promise<any> => {
    const response = await apiClient.post(`/admin/ingredients/${id}/restock`, payload);
    return response.data.data || response.data;
  },

  getIngredientAlerts: async (): Promise<any> => {
    const response = await apiClient.get('/admin/ingredients/alerts');
    return response.data.data || response.data;
  },

  getIngredientAlertCount: async (): Promise<any> => {
    const response = await apiClient.get('/admin/ingredients/alerts/count');
    return response.data.data || response.data;
  },

  getInventoryStock: async (params?: {
    low_stock?: boolean;
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<any> => {
    const response = await apiClient.get('/admin/inventory/stock', { params });
    return response.data;
  },

  getToppingInventory: async (): Promise<any> => {
    const response = await apiClient.get('/admin/inventory/toppings');
    return response.data;
  },

  getInventoryTransactions: async (params?: {
    ingredientId?: string;
    orderId?: string;
    transactionType?: string;
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<any> => {
    const response = await apiClient.get('/admin/inventory/transactions', { params });
    return response.data;
  },

  // Ước tính số lượng ly có thể pha chế với nguyên liệu hiện có
  getStockByProductVariant: async (productId: string, variantId: string | null): Promise<any> => {
    const variantPart = variantId ?? 'null';
    const response = await apiClient.get(`/admin/inventory/stock/${productId}/${variantPart}`);
    return response.data.data ?? response.data;
  }
};