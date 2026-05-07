export interface User {
  id: string;
  _id?: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  role: 'CUSTOMER' | 'ADMIN' | string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserPayload {
  email: string;
  fullName: string;
  password?: string;
  phone?: string;
  avatarUrl?: string;
  role: string;
}
