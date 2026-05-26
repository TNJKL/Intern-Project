import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { NotificationService } from '../notification/notification.service';
import { EmailService } from '../email/email.service';
import { GuestSessionService } from '../gateway/guest-session.service';

/**
 * Mock toàn bộ dependencies — EventsService chỉ chịu trách nhiệm
 * điều phối đúng handler cho đúng event type.
 */
const mockNotificationService = {
  createNotification: jest.fn().mockResolvedValue({ id: 'notif-uuid' }),
  updateNotificationStatusById: jest.fn().mockResolvedValue(undefined),
};

const mockEmailService = {
  sendOrderConfirmation: jest.fn().mockResolvedValue(undefined),
  sendOrderCancelled: jest.fn().mockResolvedValue(undefined),
  sendOrderCompleted: jest.fn().mockResolvedValue(undefined),
  sendOrderTimeout: jest.fn().mockResolvedValue(undefined),
  sendTierUpgraded: jest.fn().mockResolvedValue(undefined),
};

const mockGuestSessionService = {
  revokeByOrderCode: jest.fn().mockResolvedValue(undefined),
};

describe('EventsService', () => {
  let service: EventsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: GuestSessionService, useValue: mockGuestSessionService },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  // ─── ORDER_CREATED ───────────────────────────────────────────────────────

  describe('ORDER_CREATED', () => {
    const payload = {
      eventType: 'ORDER_CREATED',
      orderId: 'order-uuid',
      orderCode: 'ORD260526-abc',
      userId: 'user-uuid',
      userEmail: 'test@example.com',
      userName: 'Nguyen Van A',
      totalAmount: 150000,
    };

    it('nên tạo IN_APP notification', async () => {
      await service.processOrderEvent('ORDER_CREATED', payload);

      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ channel: 'IN_APP', referenceId: 'order-uuid' }),
      );
    });

    it('nên gửi email xác nhận đơn hàng', async () => {
      await service.processOrderEvent('ORDER_CREATED', payload);

      expect(mockEmailService.sendOrderConfirmation).toHaveBeenCalledWith(
        'test@example.com',
        'ORD260526-abc',
        expect.any(Object),
      );
    });

    it('KHÔNG nên revoke guest session khi đơn mới tạo', async () => {
      await service.processOrderEvent('ORDER_CREATED', payload);

      expect(mockGuestSessionService.revokeByOrderCode).not.toHaveBeenCalled();
    });
  });

  // ─── ORDER_CANCELLED ─────────────────────────────────────────────────────

  describe('ORDER_CANCELLED', () => {
    const payload = {
      eventType: 'ORDER_CANCELLED',
      orderId: 'order-uuid',
      orderCode: 'ORD260526-abc',
      userId: 'user-uuid',
      userEmail: 'test@example.com',
      userName: 'Nguyen Van A',
      reason: 'Khách hủy đơn',
    };

    it('nên tạo IN_APP notification cho đơn hủy', async () => {
      await service.processOrderEvent('ORDER_CANCELLED', payload);

      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ channel: 'IN_APP' }),
      );
    });

    it('nên gửi email thông báo hủy đơn', async () => {
      await service.processOrderEvent('ORDER_CANCELLED', payload);

      expect(mockEmailService.sendOrderCancelled).toHaveBeenCalledWith(
        'test@example.com',
        'ORD260526-abc',
        expect.any(Object),
      );
    });

    it('nên revoke guest session sau khi đơn bị hủy', async () => {
      await service.processOrderEvent('ORDER_CANCELLED', payload);

      expect(mockGuestSessionService.revokeByOrderCode).toHaveBeenCalledWith('ORD260526-abc');
    });
  });

  // ─── ORDER_COMPLETED ─────────────────────────────────────────────────────

  describe('ORDER_COMPLETED', () => {
    const memberPayload = {
      eventType: 'ORDER_COMPLETED',
      orderId: 'order-uuid',
      orderCode: 'ORD260526-abc',
      userId: 'user-uuid',
      userEmail: 'member@example.com',
      userName: 'Nguyen Van A',
      totalAmount: 200000,
    };

    const guestPayload = {
      ...memberPayload,
      eventType: 'ORDER_COMPLETED',
      userId: null,
      userEmail: 'guest@example.com',
      userName: 'Khách hàng',
    };

    it('nên gửi email hoàn thành với isGuest = false cho member', async () => {
      await service.processOrderEvent('ORDER_COMPLETED', memberPayload);

      expect(mockEmailService.sendOrderCompleted).toHaveBeenCalledWith(
        'member@example.com',
        'ORD260526-abc',
        expect.objectContaining({ isGuest: false }),
      );
    });

    it('nên gửi email hoàn thành với isGuest = true cho guest', async () => {
      await service.processOrderEvent('ORDER_COMPLETED', guestPayload);

      expect(mockEmailService.sendOrderCompleted).toHaveBeenCalledWith(
        'guest@example.com',
        'ORD260526-abc',
        expect.objectContaining({ isGuest: true }),
      );
    });

    it('nên revoke guest session sau khi đơn hoàn thành', async () => {
      await service.processOrderEvent('ORDER_COMPLETED', memberPayload);

      expect(mockGuestSessionService.revokeByOrderCode).toHaveBeenCalledWith('ORD260526-abc');
    });
  });

  // ─── ORDER_TIMEOUT ───────────────────────────────────────────────────────

  describe('ORDER_TIMEOUT', () => {
    const payload = {
      eventType: 'ORDER_TIMEOUT',
      orderId: 'order-uuid',
      orderCode: 'ORD260526-abc',
      userId: null,
      userEmail: 'guest@example.com',
      userName: 'Khách hàng',
      paymentDeadline: new Date().toISOString(),
      expiredAt: new Date().toISOString(),
    };

    it('nên gửi email timeout', async () => {
      await service.processOrderEvent('ORDER_TIMEOUT', payload);

      expect(mockEmailService.sendOrderTimeout).toHaveBeenCalledWith(
        'guest@example.com',
        'ORD260526-abc',
        expect.any(String),
      );
    });

    it('nên revoke guest session sau khi đơn timeout', async () => {
      await service.processOrderEvent('ORDER_TIMEOUT', payload);

      expect(mockGuestSessionService.revokeByOrderCode).toHaveBeenCalledWith('ORD260526-abc');
    });
  });

  // ─── ORDER_STATUS_CHANGED ─────────────────────────────────────────────────

  describe('ORDER_STATUS_CHANGED', () => {
    const payload = {
      eventType: 'ORDER_STATUS_CHANGED',
      orderId: 'order-uuid',
      orderCode: 'ORD260526-abc',
      userId: 'user-uuid',
      userEmail: 'test@example.com',
      currentStatus: 'DELIVERING',
      previousStatus: 'PREPARING',
      note: 'test',
    };

    it('nên tạo IN_APP notification cho cập nhật trạng thái', async () => {
      await service.processOrderEvent('ORDER_STATUS_CHANGED', payload);

      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: 'IN_APP',
          title: expect.stringContaining('DELIVERING'),
        }),
      );
    });

    it('KHÔNG nên gửi email khi chỉ cập nhật trạng thái', async () => {
      await service.processOrderEvent('ORDER_STATUS_CHANGED', payload);

      expect(mockEmailService.sendOrderCompleted).not.toHaveBeenCalled();
      expect(mockEmailService.sendOrderCancelled).not.toHaveBeenCalled();
    });

    it('KHÔNG nên revoke guest session khi đơn chưa kết thúc', async () => {
      await service.processOrderEvent('ORDER_STATUS_CHANGED', payload);

      expect(mockGuestSessionService.revokeByOrderCode).not.toHaveBeenCalled();
    });
  });

  // ─── Unknown event ───────────────────────────────────────────────────────

  describe('Unknown event type', () => {
    it('nên không throw khi nhận event type không biết', async () => {
      await expect(
        service.processOrderEvent('UNKNOWN_EVENT', {} as any),
      ).resolves.not.toThrow();
    });
  });
});
