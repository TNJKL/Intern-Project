import { apiClient } from '../lib/api';

export interface PaymentUrlResponse {
  success: boolean;
  message: string;
  data: {
    orderId: string;
    orderCode: string;
    paymentUrl: string;
  };
}

export interface PaymentStatusResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    orderId: string;
    amount: number;
    status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED';
    paymentMethod: string;
    transactionId: string;
    paidAt?: string;
  };
}

export interface PaymentDetail {
  id: string;
  orderId: string;
  orderCode: string;
  userId: string;
  amount: number;
  paymentMethod: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED' | 'REFUNDED';
  transactionId?: string;
  paymentUrl?: string;
  paidAt?: string;
  orderStatus?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PaymentHistoryResponse {
  success: boolean;
  message: string;
  data: PaymentDetail[];
  page?: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

export const paymentService = {
  getPaymentUrl: async (orderId: string): Promise<PaymentUrlResponse> => {
    const response = await apiClient.get(`/payments/${orderId}/url`);
    return response.data;
  },
  getPaymentStatus: async (orderId: string): Promise<PaymentStatusResponse> => {
    const response = await apiClient.get(`/payments/${orderId}/status`);
    return response.data;
  },
  getPaymentHistory: async (page = 0, size = 10): Promise<PaymentHistoryResponse> => {
    const response = await apiClient.get(`/payments/history?page=${page}&size=${size}`);
    return response.data;
  }
};
