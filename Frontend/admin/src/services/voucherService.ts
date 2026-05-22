import { apiClient } from '../lib/api';

export interface Voucher {
  id: string;
  code: string;
  name: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: number;
  maxUsageCount: number;
  currentUsageCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  createdAt: string;
}

export interface VoucherFormData {
  code: string;
  name: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  maxUsageCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
  totalPages?: number;
  totalElements?: number;
  currentPage?: number;
  pageSize?: number;
}

export const voucherService = {
  getVouchers: async () => {
    const response = await apiClient.get<ApiResponse<Voucher[]>>('/admin/vouchers');
    return response.data;
  },

  getVoucherById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<Voucher>>(`/admin/vouchers/${id}`);
    return response.data;
  },

  createVoucher: async (data: VoucherFormData) => {
    const response = await apiClient.post<ApiResponse<Voucher>>('/admin/vouchers', data);
    return response.data;
  },

  updateVoucher: async (id: string, data: VoucherFormData) => {
    const response = await apiClient.put<ApiResponse<Voucher>>(`/admin/vouchers/${id}`, data);
    return response.data;
  },

  deleteVoucher: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<null>>(`/admin/vouchers/${id}`);
    return response.data;
  },

  toggleVoucherStatus: async (id: string) => {
    const response = await apiClient.patch<ApiResponse<Voucher>>(`/admin/vouchers/${id}/toggle`);
    return response.data;
  }
};
