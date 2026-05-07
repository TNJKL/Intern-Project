export interface User {
  id: string;
  _id?: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
