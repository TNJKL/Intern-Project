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
}
