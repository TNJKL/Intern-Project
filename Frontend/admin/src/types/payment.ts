export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'EXPIRED' | 'REFUNDED' | 'PAID_BY_SHIPPER';
export type RefundStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type PaymentMethod = 'COD' | 'VNPAY';

export interface PaymentDetailResponse {
  id: string;
  orderId: string;
  orderCode: string;
  userId?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  paymentUrl?: string;
  gatewayResponse?: string;
  paidAt?: string;
  expiredAt?: string;
  orderStatus?: string;
  refundedAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Refund {
  id: string;
  paymentId: string;
  orderId: string;
  orderCode?: string;
  userId?: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  transactionId?: string;
  requestedBy?: string;
  processedAt?: string;
  recipientType?: string;
  shipperName?: string;
  shipperPhone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RefundCreateRequest {
  amount: number;
  reason: string;
  recipientType?: 'CUSTOMER' | 'SHIPPER';
  shipperName?: string;
  shipperPhone?: string;
}
