/**
 * Payload của Kafka event LOW_STOCK_ALERT từ inventory-service.
 * Topic: inventory-events
 */
export interface LowStockAlertPayload {
  eventType: 'LOW_STOCK_ALERT';
  ingredientId: string;
  ingredientName: string;
  unit: string;
  /** Tồn kho hiện tại sau lần deduct gần nhất */
  currentStock: number;
  /** Ngưỡng LOW đã cài đặt */
  lowStockThreshold: number;
  /** Ngưỡng CRITICAL tính được: lowStockThreshold × criticalPct / 100 */
  criticalAbsolute: number;
  /** % để tính criticalAbsolute (ví dụ: 5 = 5%) */
  criticalPct: number;
  /** Mức độ cảnh báo: LOW | CRITICAL | OUT_OF_STOCK */
  alertLevel: 'LOW' | 'CRITICAL' | 'OUT_OF_STOCK';
  /** Số suất còn pha được (-1 = không xác định được) */
  estimatedPortions: number;
  occurredAt: string;
}
