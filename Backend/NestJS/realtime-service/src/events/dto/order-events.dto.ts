export interface OrderEventPayload {
  eventType: string;
  orderId: string;
  orderCode: string;
  userId: string;
  userEmail?: string;
  // Spring Boot gửi userName (không phải customerName)
  userName?: string;
  customerName?: string; // giữ lại để tương thích ngược
  userPhone?: string;
  // ORDER_STATUS_CHANGED fields
  previousStatus?: string;
  currentStatus?: string;
  status?: string; // alias fallback
  note?: string;
  // ORDER_CANCELLED fields
  reason?: string;
  // ORDER_TIMEOUT fields (Instant serialized as string)
  paymentDeadline?: string;
  expiredAt?: string;
  // ORDER_CREATED / ORDER_COMPLETED fields
  items?: OrderItemPayload[];
  totalAmount?: string | number;
  // timestamp từ occurredAt
  occurredAt?: string;
  timestamp?: string; // alias fallback
}

export interface OrderItemPayload {
  productId?: string;
  variantId?: string;
  variantLabel?: string;
  productName?: string;
  toppings?: any[];
  unitPrice?: number | string;
  quantity?: number;
  subtotal?: number | string;
}

export interface OrderTimeoutEventPayload extends OrderEventPayload {
  paymentDeadline?: string;
  expiredAt?: string;
}

export interface OrderStatusChangedEventPayload extends OrderEventPayload {
  previousStatus: string;
  currentStatus: string;
  note?: string;
}

export interface OrderCompletedEventPayload extends OrderEventPayload {
  userName?: string;
  userPhone?: string;
  totalAmount?: string | number;
  items?: OrderItemPayload[];
}

// TIER_UPGRADED được bắn bởi service khác (nếu có), không phải order-service
// Giữ lại interface để tương thích
export interface TierUpdateEventPayload {
  eventType: string;
  userId: string;
  userEmail?: string;
  customerName?: string;
  userName?: string;
  tier: string;
  totalSpent: string | number;
  occurredAt?: string;
  timestamp?: string;
}
