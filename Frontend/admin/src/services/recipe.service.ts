// 📄 Vị trí file: src/services/recipe.service.ts
import { apiClient } from '../lib/api';

export interface RecipeIngredient {
  ingredientId: string;
  quantity: number;
}

export interface Recipe {
  id?: string;
  productId: string;
  variantId: string;
  version: number;
  ingredients: RecipeIngredient[];
}

export const recipeService = {
  // Lấy danh sách tất cả công thức
  getAllRecipes: async (params?: { page?: number; size?: number }): Promise<any> => {
    const response = await apiClient.get('/admin/recipes', { params });
    return response.data;
  },

  // Lấy công thức theo Product ID và Variant ID
  getRecipe: async (productId: string, variantId: string): Promise<Recipe> => {
    const response = await apiClient.get(`/admin/recipes/product/${productId}/variant/${variantId}`);
    return response.data.data || response.data;
  },

  // Lưu công thức mới
  saveRecipe: async (recipe: Recipe): Promise<any> => {
    const response = await apiClient.post('/admin/recipes', recipe);
    return response.data.data || response.data;
  },

  // Cập nhật công thức cũ
  updateRecipe: async (id: string, recipe: Recipe): Promise<any> => {
    const response = await apiClient.put(`/admin/recipes/${id}`, recipe);
    return response.data.data || response.data;
  },

  // Xóa công thức
  deleteRecipe: async (productId: string, variantId: string): Promise<void> => {
    await apiClient.delete(`/admin/recipes/product/${productId}/variant/${variantId}`);
  }
};
