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

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ValidateVoucherResult {
  valid: boolean;
  code: string;
  message: string;
  discountAmount?: number;
}

export const voucherService = {
  getVouchers: async (): Promise<ApiResponse<Voucher[]>> => {
    // Thử gọi api admin vì user cung cấp link này, nếu bị 403/404 có thể fallback hoặc BE đã mở quyền đọc cho Client.
    const response = await apiClient.get<ApiResponse<Voucher[]>>('/admin/vouchers');
    return response.data;
  },

  validateVoucher: async (code: string, orderAmount: number): Promise<ApiResponse<ValidateVoucherResult>> => {
    const response = await apiClient.get<ApiResponse<ValidateVoucherResult>>(`/vouchers/validate/${code}`, {
      params: { orderAmount }
    });
    return response.data;
  }
};
