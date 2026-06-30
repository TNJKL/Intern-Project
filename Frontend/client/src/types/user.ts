export interface UserAddress {
  id: string;
  label: string;
  detailAddress: string;
  isDefault: boolean;
}

export interface User {
  id: string;
  _id?: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  role: string;
  tier?: 'MEMBER' | 'VIP' | string;
  isActive: boolean;
  addresses?: UserAddress[];
  createdAt: string;
  updatedAt: string;
}
