import { apiClient } from '../lib/api';

export interface UpdateProfileData {
  fullName?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  addresses?: any[];
}

export interface ChangePasswordData {
  oldPassword: string;
  newPassword: string;
}

export const userService = {
  // Get own profile info via GET /users/me (read-only)
  getProfile: async () => {
    const response = await apiClient.get('/users/me');
    return response.data;
  },

  // Self-update: PUT /users/me with own token
  updateProfile: async (data: UpdateProfileData) => {
    const response = await apiClient.put('/users/me', data);
    return response.data;
  },

  // Change password: PUT /users/me/password
  changePassword: async (data: ChangePasswordData) => {
    const response = await apiClient.put('/users/me/password', data);
    return response.data;
  },
};
