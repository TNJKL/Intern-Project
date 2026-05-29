import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';

interface RateLimitEntry {
  count: number;
  resetAt: number; // Unix timestamp (ms) khi window reset
}

/**
 * In-memory rate limiter cho WebSocket — 2 layer độc lập.
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  Layer 1 — Connection (IP-based)                            │
 * │  connStore: Map<ip, RateLimitEntry>                         │
 * │  Chặn spam kết nối trước khi bất kỳ guard nào chạy.         │
 * ├─────────────────────────────────────────────────────────────┤
 * │  Layer 2 — Event (socketId-based)                           │
 * │  eventStore: Map<socketId, Map<eventName, RateLimitEntry>>  │
 * │  Chặn authenticated user spam join/join-guest.              │
 * └─────────────────────────────────────────────────────────────┘
 *
 * Cải tiến so với flat Map<string, entry>:
 *   • clearSocket() là O(1) thay vì O(n) — delete toàn bộ socketId bucket
 *   • setInterval được track và clear đúng cách khi module destroy
 *
 * Lưu ý scale: In-memory chỉ phù hợp single-instance.
 * Horizontal scaling → cần Redis INCR + EXPIRE.
 */
@Injectable()
export class WsRateLimiterService implements OnModuleDestroy {
  private readonly logger = new Logger(WsRateLimiterService.name);

  /**
   * Layer 2: Event rate limit per socket.
   * Map<socketId, Map<eventName, RateLimitEntry>>
   *
   * Dùng nested Map thay vì flat Map<"socketId:event", entry>
   * để clearSocket() có thể xóa toàn bộ bucket trong O(1).
   */
  private readonly eventStore = new Map<string, Map<string, RateLimitEntry>>();

  /**
   * Layer 1: Connection rate limit per IP.
   * Map<ip, RateLimitEntry>
   *
   * Tách riêng khỏi eventStore vì IP entries KHÔNG bị xóa khi socket disconnect
   * (cố ý — counter IP cần tồn tại xuyên suốt window để chặn reconnect liên tục).
   */
  private readonly connStore = new Map<string, RateLimitEntry>();

  /** Reference tới cleanup interval — phải clear khi module bị destroy */
  private readonly cleanupTimer: ReturnType<typeof setInterval>;

  private readonly CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 phút

  constructor() {
    this.cleanupTimer = setInterval(() => this.cleanup(), this.CLEANUP_INTERVAL_MS);
  }

  /** Dừng cleanup timer khi NestJS module bị teardown (test, graceful shutdown) */
  onModuleDestroy(): void {
    clearInterval(this.cleanupTimer);
    this.logger.debug('WsRateLimiterService cleanup timer cleared.');
  }

  // ─── Layer 1: Connection Rate Limit (IP-based) ───────────────────────────

  /**
   * Gọi trong handleConnection() — chạy trước mọi event handler và guard.
   * Chặn cả spam kết nối lẫn spam join-no-token.
   *
   * @param ip - IP từ client.handshake.address (hoặc x-forwarded-for)
   * @param maxConnections - Số kết nối tối đa từ 1 IP trong window (default: 10)
   * @param windowMs - Kích thước window ms (default: 60s)
   * @returns true nếu BỊ CHẶN
   */
  isConnectionRateLimited(
    ip: string,
    maxConnections: number = 10,
    windowMs: number = 60_000,
  ): boolean {
    return this._check(this.connStore, ip, maxConnections, windowMs, `connection from IP ${ip}`);
  }

  // ─── Layer 2: Event Rate Limit (socketId-based) ──────────────────────────

  /**
   * Gọi trong event handler để chặn spam event trên cùng 1 socket.
   *
   * @param socketId - Socket.IO socket ID
   * @param eventName - Tên event ('join', 'join-guest')
   * @param maxAttempts - Số lần tối đa (default: 5)
   * @param windowMs - Kích thước window ms (default: 30s)
   * @returns true nếu BỊ CHẶN
   */
  isRateLimited(
    socketId: string,
    eventName: string,
    maxAttempts: number = 5,
    windowMs: number = 30_000,
  ): boolean {
    // Lấy hoặc tạo bucket cho socket này
    let bucket = this.eventStore.get(socketId);
    if (!bucket) {
      bucket = new Map<string, RateLimitEntry>();
      this.eventStore.set(socketId, bucket);
    }

    return this._check(bucket, eventName, maxAttempts, windowMs, `socket ${socketId} event "${eventName}"`);
  }

  /**
   * Lấy thông tin remaining attempts và thời gian reset.
   * Dùng để trả về thông báo có ích cho client khi bị chặn.
   */
  getRateLimitInfo(
    socketId: string,
    eventName: string,
    maxAttempts: number,
  ): { remaining: number; resetInSeconds: number } {
    const entry = this.eventStore.get(socketId)?.get(eventName);
    return this._getInfo(entry, maxAttempts);
  }

  /**
   * Xóa toàn bộ event bucket của một socket khi nó disconnect.
   *
   * O(1) — delete trực tiếp key socketId thay vì scan toàn bộ Map.
   *
   * IP connection entries KHÔNG bị xóa (cố ý):
   * counter IP cần tồn tại đến hết window để chặn reconnect liên tục.
   */
  clearSocket(socketId: string): void {
    this.eventStore.delete(socketId);
  }

  // ─── Internal helpers ────────────────────────────────────────────────────

  private _check(
    store: Map<string, RateLimitEntry>,
    key: string,
    max: number,
    windowMs: number,
    label: string,
  ): boolean {
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now >= entry.resetAt) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return false;
    }

    if (entry.count >= max) {
      const remainingSec = Math.ceil((entry.resetAt - now) / 1000);
      this.logger.warn(`Rate limit exceeded for ${label}. Resets in ${remainingSec}s.`);
      return true;
    }

    entry.count++;
    return false;
  }

  private _getInfo(
    entry: RateLimitEntry | undefined,
    max: number,
  ): { remaining: number; resetInSeconds: number } {
    const now = Date.now();

    if (!entry || now >= entry.resetAt) {
      return { remaining: max, resetInSeconds: 0 };
    }

    return {
      remaining: Math.max(0, max - entry.count),
      resetInSeconds: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  /**
   * Dọn dẹp entries hết hạn trong cả 2 store mỗi 5 phút.
   * Đây vẫn là O(n) nhưng chỉ chạy định kỳ — không ảnh hưởng latency của requests.
   */
  private cleanup(): void {
    const now = Date.now();
    let removed = 0;

    // Cleanup connStore (IP entries)
    for (const [ip, entry] of this.connStore.entries()) {
      if (now >= entry.resetAt) {
        this.connStore.delete(ip);
        removed++;
      }
    }

    // Cleanup eventStore (socket bucket entries)
    for (const [socketId, bucket] of this.eventStore.entries()) {
      for (const [event, entry] of bucket.entries()) {
        if (now >= entry.resetAt) {
          bucket.delete(event);
          removed++;
        }
      }
      // Nếu bucket rỗng sau cleanup → xóa luôn socket entry
      if (bucket.size === 0) {
        this.eventStore.delete(socketId);
      }
    }

    if (removed > 0) {
      this.logger.debug(`WsRateLimiter cleanup: removed ${removed} expired entries.`);
    }
  }
}
