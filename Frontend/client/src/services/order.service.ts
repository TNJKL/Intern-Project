import { apiClient } from '../lib/api';

export interface OrderItemRequest {
  productId: string;
  variantId: string;
  quantity: number;
  toppingIds: string[];
}

export interface CreateOrderRequest {
  userName?: string;
  userEmail?: string;
  userPhone: string;
  deliveryAddress: string;
  paymentMethod: string;
  note?: string;
  items: OrderItemRequest[];
  voucherCode?: string;
}

export interface OrderTopping {
  id: string;
  name: string;
  unitPrice: number;
}

export interface OrderDetailItem {
  id: string;
  productName: string;
  variantLabel: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  toppings: OrderTopping[];
}

export interface OrderDetail {
  id: string;
  orderCode: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhone: string;
  subtotal: number;
  discountAmount: number;
  voucherId?: string;
  voucherCode?: string;
  deliveryAddress: string;
  paymentMethod: string;
  note?: string;
  updatedAt: string;
  items: OrderDetailItem[];
}

export interface OrderDetailResponse {
  success: boolean;
  message: string;
  data: OrderDetail;
}

export const orderService = {
  createOrder: async (data: CreateOrderRequest) => {
    const response = await apiClient.post('/orders', data);
    return response.data;
  },
  getOrderById: async (id: string): Promise<OrderDetailResponse> => {
    const response = await apiClient.get(`/orders/${id}`);
    return response.data;
  },
  cancelOrder: async (id: string) => {
    const response = await apiClient.post(`/orders/${id}/cancel`);
    return response.data;
  },
  trackOrder: async (orderCode: string, userPhone?: string): Promise<OrderDetailResponse> => {
    const response = await apiClient.post(`/orders/track?code=${encodeURIComponent(orderCode)}&phone=${encodeURIComponent(userPhone || '')}`);
    return response.data;
  },
};
