import { apiClient } from '../lib/api';
import axios from 'axios';

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
  applicableTier?: 'ALL' | 'MEMBER' | 'VIP';
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

export const FALLBACK_VOUCHERS: Voucher[] = [
  {
    id: "v_giam5",
    code: "GIAM5",
    name: "Giảm 5% cho đơn hàng",
    discountType: "PERCENTAGE",
    discountValue: 5,
    minOrderAmount: 30000,
    maxDiscountAmount: 20000,
    maxUsageCount: 100,
    currentUsageCount: 5,
    validFrom: "2026-05-01T00:00:00.000Z",
    validUntil: "2027-01-01T00:00:00.000Z",
    isActive: true,
    applicableTier: "ALL",
    createdAt: "2026-05-01T00:00:00.000Z"
  },
  {
    id: "v_usage",
    code: "USAGE",
    name: "Test giảm giá per user",
    discountType: "FIXED_AMOUNT",
    discountValue: 25000,
    minOrderAmount: 50000,
    maxDiscountAmount: 25000,
    maxUsageCount: 15,
    currentUsageCount: 12,
    validFrom: "2026-05-01T00:00:00.000Z",
    validUntil: "2027-01-01T00:00:00.000Z",
    isActive: true,
    applicableTier: "ALL",
    createdAt: "2026-05-01T00:00:00.000Z"
  },
  {
    id: "v_welcome10",
    code: "WELCOME10",
    name: "Chào bạn mới - Giảm 10% đơn hàng",
    discountType: "PERCENTAGE",
    discountValue: 10,
    minOrderAmount: 0,
    maxDiscountAmount: 50000,
    maxUsageCount: 1000,
    currentUsageCount: 154,
    validFrom: "2026-05-01T00:00:00.000Z",
    validUntil: "2027-01-01T00:00:00.000Z",
    isActive: true,
    applicableTier: "ALL",
    createdAt: "2026-05-01T00:00:00.000Z"
  },
  {
    id: "v_guest",
    code: "GUEST",
    name: "Test giảm giá per user vô hạn",
    discountType: "FIXED_AMOUNT",
    discountValue: 25000,
    minOrderAmount: 50000,
    maxDiscountAmount: 25000,
    maxUsageCount: 10,
    currentUsageCount: 10,
    validFrom: "2026-05-01T00:00:00.000Z",
    validUntil: "2027-01-01T00:00:00.000Z",
    isActive: true,
    applicableTier: "MEMBER",
    createdAt: "2026-05-01T00:00:00.000Z"
  },
  {
    id: "v_member",
    code: "MEMBER",
    name: "Mã dành cho thành viên",
    discountType: "FIXED_AMOUNT",
    discountValue: 25000,
    minOrderAmount: 50000,
    maxDiscountAmount: 25000,
    maxUsageCount: 35,
    currentUsageCount: 35,
    validFrom: "2026-05-01T00:00:00.000Z",
    validUntil: "2027-01-01T00:00:00.000Z",
    isActive: true,
    applicableTier: "MEMBER",
    createdAt: "2026-05-01T00:00:00.000Z"
  },
  {
    id: "v_vip1",
    code: "VIP1",
    name: "Mã dành cho khách vip 1",
    discountType: "PERCENTAGE",
    discountValue: 50,
    minOrderAmount: 100000,
    maxDiscountAmount: 100000,
    maxUsageCount: 10,
    currentUsageCount: 10,
    validFrom: "2026-05-01T00:00:00.000Z",
    validUntil: "2027-01-01T00:00:00.000Z",
    isActive: true,
    applicableTier: "VIP",
    createdAt: "2026-05-01T00:00:00.000Z"
  }
];

export const voucherService = {
  getVouchers: async (): Promise<ApiResponse<Voucher[]>> => {
    try {
      // Gọi qua API route public của Next.js (được tạo để sử dụng guestToken)
      // Dùng trực tiếp axios thay vì apiClient để tránh interceptor bắt 403 và log out
      const response = await axios.get<ApiResponse<Voucher[]>>('/api/public/vouchers?size=100');
      return response.data;
    } catch (error) {
      console.warn("[Voucher Service] Public endpoint/admin endpoint failed, using fallback vouchers:", error);
      return {
        success: true,
        message: "Lấy danh sách voucher thành công (dữ liệu mẫu)",
        data: FALLBACK_VOUCHERS
      };
    }
  },

  validateVoucher: async (code: string, orderAmount: number): Promise<ApiResponse<ValidateVoucherResult>> => {
    const response = await apiClient.get<ApiResponse<ValidateVoucherResult>>(`/vouchers/validate/${code}`, {
      params: { orderAmount }
    });
    return response.data;
  }
};
