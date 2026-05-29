import { Test, TestingModule } from '@nestjs/testing';
import { GuestSessionService } from './guest-session.service';

/**
 * Mock ioredis thay vì kết nối Redis thật.
 * Tất cả các method của Redis được mock trả về giá trị cụ thể trong từng test.
 */
const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  on: jest.fn(),
  quit: jest.fn(),
};

// Intercept constructor của ioredis để trả về mock
jest.mock('ioredis', () => {
  const RedisMock = jest.fn().mockImplementation(() => mockRedis);
  return { __esModule: true, default: RedisMock };
});

describe('GuestSessionService', () => {
  let service: GuestSessionService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockRedis.on.mockImplementation(() => mockRedis); // chaining

    const module: TestingModule = await Test.createTestingModule({
      providers: [GuestSessionService],
    }).compile();

    service = module.get<GuestSessionService>(GuestSessionService);
    // Khởi tạo Redis connection (lifecycle hook)
    await service.onModuleInit();
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  // ─── getOrderCode ────────────────────────────────────────────────────────

  describe('getOrderCode()', () => {
    it('nên trả về orderCode khi guestSessionId hợp lệ', async () => {
      mockRedis.get.mockResolvedValueOnce('ORD260526-abc123');

      const result = await service.getOrderCode('valid-session-id');

      expect(result).toBe('ORD260526-abc123');
      expect(mockRedis.get).toHaveBeenCalledWith('guest:session:valid-session-id');
    });

    it('nên strip dấu ngoặc kép JSON do Spring Boot serializer tạo ra', async () => {
      // Spring Boot Jackson serializer lưu string có dấu ngoặc kép
      mockRedis.get.mockResolvedValueOnce('"ORD260526-abc123"');

      const result = await service.getOrderCode('valid-session-id');

      expect(result).toBe('ORD260526-abc123'); // phải bỏ ngoặc kép
    });

    it('nên trả về null khi guestSessionId không tồn tại hoặc hết hạn', async () => {
      mockRedis.get.mockResolvedValueOnce(null);

      const result = await service.getOrderCode('expired-session-id');

      expect(result).toBeNull();
    });

    it('nên trả về null và không throw khi Redis lỗi', async () => {
      mockRedis.get.mockRejectedValueOnce(new Error('Redis connection lost'));

      const result = await service.getOrderCode('any-session-id');

      expect(result).toBeNull(); // không được throw
    });
  });

  // ─── revokeByOrderCode ──────────────────────────────────────────────────

  describe('revokeByOrderCode()', () => {
    it('nên xóa cả 2 Redis key khi session tồn tại', async () => {
      mockRedis.get.mockResolvedValueOnce('"valid-session-uuid"');
      mockRedis.del.mockResolvedValueOnce(2);

      await service.revokeByOrderCode('ORD260526-abc123');

      expect(mockRedis.get).toHaveBeenCalledWith('guest:order:ORD260526-abc123');
      expect(mockRedis.del).toHaveBeenCalledWith(
        'guest:session:valid-session-uuid',
        'guest:order:ORD260526-abc123',
      );
    });

    it('nên không làm gì khi không có session cho orderCode này', async () => {
      mockRedis.get.mockResolvedValueOnce(null);

      await service.revokeByOrderCode('ORD260526-no-session');

      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it('nên strip JSON quotes khi revoke', async () => {
      // Spring Boot lưu sessionId cũng có thể có JSON quotes
      mockRedis.get.mockResolvedValueOnce('"uuid-with-quotes"');
      mockRedis.del.mockResolvedValueOnce(2);

      await service.revokeByOrderCode('ORD260526-abc123');

      expect(mockRedis.del).toHaveBeenCalledWith(
        'guest:session:uuid-with-quotes', // phải strip quotes
        'guest:order:ORD260526-abc123',
      );
    });

    it('nên không throw khi Redis lỗi — revoke là best-effort', async () => {
      mockRedis.get.mockResolvedValueOnce('"some-session"');
      mockRedis.del.mockRejectedValueOnce(new Error('Redis timeout'));

      // Phải không throw
      await expect(service.revokeByOrderCode('ORD-xxx')).resolves.not.toThrow();
    });
  });
});
