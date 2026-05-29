import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * Validate guestSessionId bằng cách kiểm tra Redis (cùng instance với Order Service).
 * Key format: guest:session:{guestSessionId}  →  VALUE = orderCode
 * Key được tạo bởi Order Service (GuestSessionCacheService.java) khi guest tạo đơn.
 */
@Injectable()
export class GuestSessionService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(GuestSessionService.name);
  private redis: Redis;

  onModuleInit() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      lazyConnect: true,
    });

    this.redis.on('error', (err) => {
      this.logger.error('Redis connection error in GuestSessionService:', err.message);
    });

    this.redis.on('connect', () => {
      this.logger.log('GuestSessionService connected to Redis');
    });
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
    }
  }

  /**
   * Lấy orderCode từ guestSessionId.
   * @returns orderCode nếu session hợp lệ và chưa hết hạn, null nếu không tồn tại hoặc hết hạn.
   */
  async getOrderCode(guestSessionId: string): Promise<string | null> {
    try {
      const key = `guest:session:${guestSessionId}`;
      let orderCode = await this.redis.get(key);
      if (!orderCode) return null;

      // Spring Boot RedisTemplate dùng Jackson serializer nên lưu String dưới dạng JSON:
      // "ORD260526-xxx" → được lưu là `"ORD260526-xxx"` (có dấu ngoặc kép).
      // Cần strip dấu ngoặc kép bên ngoài để tên room khớp với lúc emit.
      if (orderCode.startsWith('"') && orderCode.endsWith('"')) {
        orderCode = orderCode.slice(1, -1);
      }

      return orderCode;
    } catch (error) {
      this.logger.error(`Failed to get guest session ${guestSessionId}:`, error.message);
      return null;
    }
  }

  /**
   * Revoke guest session theo orderCode.
   * Dùng khi đơn hàng kết thúc (COMPLETED / CANCELLED / TIMEOUT).
   * Xóa cả 2 key: forward (guest:session:...) và reverse (guest:order:...).
   * Best-effort — không throw nếu thất bại để không ảnh hưởng luồng chính.
   */
  async revokeByOrderCode(orderCode: string): Promise<void> {
    try {
      const orderKey = `guest:order:${orderCode}`;
      let guestSessionId = await this.redis.get(orderKey);

      if (!guestSessionId) {
        // Không có session — guest chưa dùng Socket hoặc TTL đã hết
        return;
      }

      // Strip JSON quotes do Spring Boot Jackson serializer
      if (guestSessionId.startsWith('"') && guestSessionId.endsWith('"')) {
        guestSessionId = guestSessionId.slice(1, -1);
      }

      // Xóa cả 2 key đồng thời
      await this.redis.del(`guest:session:${guestSessionId}`, orderKey);

      this.logger.log(`Revoked guest session for order ${orderCode} (session: ${guestSessionId})`);
    } catch (error) {
      this.logger.error(`Failed to revoke guest session for order ${orderCode}:`, error.message);
    }
  }
}
