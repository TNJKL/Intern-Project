import { apiClient } from '../lib/api';

export interface Topping {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export const toppingService = {
  getAllToppings: async (): Promise<Topping[]> => {
    const response = await apiClient.get('/toppings');
    return response.data.data || response.data;
  },

  getToppingById: async (id: string): Promise<Topping> => {
    const response = await apiClient.get(`/toppings/${id}`);
    return response.data.data || response.data;
  },

  createTopping: async (data: Partial<Topping>): Promise<Topping> => {
    const response = await apiClient.post('/toppings', data);
    return response.data.data || response.data;
  },

  updateTopping: async (id: string, data: Partial<Topping>): Promise<Topping> => {
    const response = await apiClient.put(`/toppings/${id}`, data);
    return response.data.data || response.data;
  },

  deleteTopping: async (id: string): Promise<void> => {
    await apiClient.delete(`/toppings/${id}`);
  }
};
