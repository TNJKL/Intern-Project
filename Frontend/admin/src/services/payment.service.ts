import { apiClient } from '../lib/api';
import { type PaymentDetailResponse, type Refund, type RefundCreateRequest } from '../types/payment';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
  pageSize: number;
}

export const paymentService = {
  getPayments: async (params?: {
    orderId?: string;
    orderCode?: string;
    userId?: string;
    status?: string;
    paymentMethod?: string;
    createdFrom?: string;
    createdTo?: string;
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<PaginatedResponse<PaymentDetailResponse>> => {
    const response = await apiClient.get('/admin/payments', { params });
    return response.data;
  },

  getRefunds: async (params?: {
    paymentId?: string;
    orderId?: string;
    orderCode?: string;
    userId?: string;
    status?: string;
    requestedBy?: string;
    recipientType?: string;
    createdFrom?: string;
    createdTo?: string;
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<PaginatedResponse<Refund>> => {
    const response = await apiClient.get('/admin/refunds', { params });
    return response.data;
  },

  refundPayment: async (paymentId: string, data: RefundCreateRequest): Promise<ApiResponse<PaymentDetailResponse>> => {
    const response = await apiClient.post(`/admin/payments/${paymentId}/refund`, data);
    return response.data;
  }
};
