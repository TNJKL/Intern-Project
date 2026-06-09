import { apiClient } from '../lib/api';
import type { UserPayload } from '@/types/user';

export interface ChangePasswordData {
  oldPassword: string;
  newPassword: string;
}

export const userService = {
  getUsers: async (page = 0, size = 8) => {
    const response = await apiClient.get('/users', { params: { page, size } });
    return response.data;
  },

  getUserById: async (id: string) => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  createUser: async (data: UserPayload) => {
    const response = await apiClient.post('/users', data);
    return response.data;
  },

  updateUser: async (id: string, data: Partial<UserPayload>) => {
    const response = await apiClient.put(`/users/${id}`, data);
    return response.data;
  },

  // Self-update profile via PUT /users/me
  updateProfile: async (data: { fullName?: string; email?: string; phone?: string; password?: string }) => {
    const response = await apiClient.put('/users/me', data);
    return response.data;
  },

  // Get own profile info via GET /auth/me (read-only)
  getProfile: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  // Change password: PUT /users/me/password
  changePassword: async (data: ChangePasswordData) => {
    const response = await apiClient.put('/users/me/password', data);
    return response.data;
  },

  deleteUser: async (id: string) => {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  }
};
