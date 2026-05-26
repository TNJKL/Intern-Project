import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationService } from './notification.service';
import { NotificationEmitterService } from './notification-emitter.service';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/notification.dto';

/**
 * Mock Repository TypeORM — không cần database thật.
 */
const mockRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  count: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

/**
 * Mock NotificationEmitterService — kiểm tra emit có được gọi đúng không.
 */
const mockEmitter = {
  emit: jest.fn(),
  registerHandler: jest.fn(),
  unregisterHandler: jest.fn(),
};

describe('NotificationService', () => {
  let service: NotificationService;
  let repo: jest.Mocked<Repository<Notification>>;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: getRepositoryToken(Notification),
          useValue: mockRepository,
        },
        {
          provide: NotificationEmitterService,
          useValue: mockEmitter,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    repo = module.get(getRepositoryToken(Notification));
  });

  // ─── createNotification ─────────────────────────────────────────────────

  describe('createNotification()', () => {
    const baseDto: CreateNotificationDto = {
      userId: 'user-uuid',
      userEmail: 'test@example.com',
      channel: 'IN_APP',
      title: 'Test title',
      body: 'Test body',
      referenceType: 'ORDER',
      referenceId: 'order-uuid',
    };

    it('nên tạo và lưu notification thành công', async () => {
      const saved = { id: 'notif-uuid', ...baseDto, status: 'PENDING', isRead: false, createdAt: new Date() };
      mockRepository.create.mockReturnValue(saved);
      mockRepository.save.mockResolvedValue(saved);

      const result = await service.createNotification(baseDto);

      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.id).toBe('notif-uuid');
    });

    it('nên emit realtime khi channel là IN_APP và có userId (Member)', async () => {
      const saved = {
        id: 'notif-uuid', userId: 'user-uuid', userEmail: 'test@example.com',
        channel: 'IN_APP', title: 'Test', body: 'Body', data: {},
        status: 'PENDING', isRead: false, createdAt: new Date(),
      };
      mockRepository.create.mockReturnValue(saved);
      mockRepository.save.mockResolvedValue(saved);

      await service.createNotification(baseDto);

      expect(mockEmitter.emit).toHaveBeenCalledTimes(1);
      expect(mockEmitter.emit).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-uuid', channel: 'IN_APP' }),
      );
    });

    it('nên emit realtime khi channel là IN_APP và Guest có orderCode trong data', async () => {
      const guestDto: CreateNotificationDto = {
        ...baseDto,
        userId: null,
        data: { orderCode: 'ORD260526-abc' },
      };
      const saved = {
        id: 'notif-uuid', userId: null, userEmail: 'guest@test.com',
        channel: 'IN_APP', title: 'Test', body: 'Body',
        data: { orderCode: 'ORD260526-abc' },
        status: 'PENDING', isRead: false, createdAt: new Date(),
      };
      mockRepository.create.mockReturnValue(saved);
      mockRepository.save.mockResolvedValue(saved);

      await service.createNotification(guestDto);

      expect(mockEmitter.emit).toHaveBeenCalledTimes(1);
      expect(mockEmitter.emit).toHaveBeenCalledWith(
        expect.objectContaining({ userId: null }),
      );
    });

    it('KHÔNG nên emit khi channel là EMAIL', async () => {
      const emailDto: CreateNotificationDto = { ...baseDto, channel: 'EMAIL' };
      const saved = { id: 'notif-uuid', ...emailDto, status: 'PENDING', isRead: false, createdAt: new Date() };
      mockRepository.create.mockReturnValue(saved);
      mockRepository.save.mockResolvedValue(saved);

      await service.createNotification(emailDto);

      expect(mockEmitter.emit).not.toHaveBeenCalled();
    });

    it('KHÔNG nên emit khi Guest IN_APP nhưng không có orderCode', async () => {
      const guestNoCodeDto: CreateNotificationDto = {
        ...baseDto,
        userId: null,
        data: {},  // không có orderCode
      };
      const saved = {
        id: 'notif-uuid', userId: null, channel: 'IN_APP',
        data: {}, status: 'PENDING', isRead: false, createdAt: new Date(),
      };
      mockRepository.create.mockReturnValue(saved);
      mockRepository.save.mockResolvedValue(saved);

      await service.createNotification(guestNoCodeDto);

      expect(mockEmitter.emit).not.toHaveBeenCalled();
    });
  });

  // ─── getUnreadCount ──────────────────────────────────────────────────────

  describe('getUnreadCount()', () => {
    it('nên trả về đúng số lượng thông báo chưa đọc', async () => {
      mockRepository.count.mockResolvedValue(5);

      const result = await service.getUnreadCount('user-uuid');

      expect(result).toEqual({ count: 5 });
      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { userId: 'user-uuid', isRead: false },
      });
    });
  });

  // ─── markAsRead ──────────────────────────────────────────────────────────

  describe('markAsRead()', () => {
    it('nên cập nhật isRead = true và status = READ', async () => {
      const notification = { id: 'notif-uuid', userId: 'user-uuid', isRead: false, status: 'PENDING' };
      mockRepository.findOne.mockResolvedValue(notification);
      mockRepository.save.mockResolvedValue({ ...notification, isRead: true, status: 'READ' });

      const result = await service.markAsRead('notif-uuid', 'user-uuid');

      expect(result.isRead).toBe(true);
      expect(result.status).toBe('READ');
    });

    it('nên throw NotFoundException khi không tìm thấy thông báo', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.markAsRead('invalid-id', 'user-uuid'))
        .rejects.toThrow('Notification invalid-id not found');
    });
  });

  // ─── markAllAsRead ───────────────────────────────────────────────────────

  describe('markAllAsRead()', () => {
    it('nên trả về số lượng bản ghi được cập nhật', async () => {
      mockRepository.update.mockResolvedValue({ affected: 3 });

      const result = await service.markAllAsRead('user-uuid');

      expect(result).toEqual({ updated: 3 });
    });
  });
});
