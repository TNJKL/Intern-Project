import { apiClient } from '../lib/api';

export interface Order {
  id: string;
  orderCode: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  userId?: string | null;
  userName?: string;
  userPhone?: string;
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

export interface OrderDetail extends Order {
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
  cancellationReason?: string;
  updatedAt: string;
  items: OrderDetailItem[];
}

export interface OrderDetailResponse {
  success: boolean;
  message: string;
  data: OrderDetail;
}

export interface OrderPageResponse {
  success: boolean;
  message: string;
  data: Order[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
  pageSize: number;
}

export interface GetOrdersParams {
  page?: number;
  size?: number;
  keyword?: string; // Assuming we might want to search by order code
  sort?: string;
}

export const orderService = {
  getOrders: async (params?: GetOrdersParams): Promise<OrderPageResponse> => {
    const response = await apiClient.get('/admin/orders', { params });
    return response.data;
  },
  getOrderById: async (id: string): Promise<OrderDetailResponse> => {
    const response = await apiClient.get(`/orders/${id}`); // User requested GET /api/v1/orders/{id}
    return response.data;
  },
  updateOrderStatus: async (id: string, status: string) => {
    const response = await apiClient.patch(`/orders/${id}/status`, { status });
    return response.data;
  },
  trackOrder: async (orderCode: string): Promise<OrderDetailResponse> => {
    const response = await apiClient.post('/orders/track', { orderCode });
    return response.data;
  },
};
