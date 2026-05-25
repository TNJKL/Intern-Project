import { Injectable, Logger } from '@nestjs/common';
import { NotificationService } from '../notification/notification.service';
import { EmailService } from '../email/email.service';
import {
  OrderEventPayload,
  OrderCompletedEventPayload,
  OrderStatusChangedEventPayload,
  OrderTimeoutEventPayload,
  TierUpdateEventPayload,
} from './dto/order-events.dto';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private notificationService: NotificationService,
    private emailService: EmailService,
  ) {}

  async processOrderEvent(eventType: string, payload: OrderEventPayload | TierUpdateEventPayload) {
    switch (eventType) {
      case 'ORDER_CREATED':
        await this.handleOrderCreated(payload as OrderEventPayload);
        break;
      case 'ORDER_CANCELLED':
        await this.handleOrderCancelled(payload as OrderEventPayload);
        break;
      // Spring Boot bắn "ORDER_STATUS_CHANGED" (không phải ORDER_STATUS_UPDATED)
      case 'ORDER_STATUS_CHANGED':
        await this.handleOrderStatusChanged(payload as OrderStatusChangedEventPayload);
        break;
      // Spring Boot bắn "ORDER_COMPLETED" khi đơn hoàn thành (thay thế PAYMENT_SUCCESS)
      case 'ORDER_COMPLETED':
        await this.handleOrderCompleted(payload as OrderCompletedEventPayload);
        break;
      case 'ORDER_TIMEOUT':
        await this.handleOrderTimeout(payload as OrderTimeoutEventPayload);
        break;
      // TIER_UPGRADED: bắn bởi service khác nếu có
      case 'TIER_UPGRADED':
        await this.handleTierUpgraded(payload as unknown as TierUpdateEventPayload);
        break;
      default:
        this.logger.warn(`Unknown event type: ${eventType}`);
    }
  }

  private async handleOrderCreated(payload: OrderEventPayload) {
    const userId = payload.userId;
    const userEmail = payload.userEmail;
    // Spring Boot gửi userName, fallback customerName để tương thích
    const customerName = payload.userName || payload.customerName || 'Khách hàng';

    await this.notificationService.createNotification({
      userId,
      userEmail,
      channel: 'IN_APP',
      title: `Đơn hàng #${payload.orderCode} đã được tạo`,
      body: `Cảm ơn bạn đã đặt hàng! Đơn hàng #${payload.orderCode} đang được xử lý.`,
      referenceType: 'ORDER',
      referenceId: payload.orderId,
      data: {
        orderCode: payload.orderCode,
        status: 'CREATED',
        customerName,
      },
    });

    if (userEmail) {
      // Tạo notification EMAIL trước
      const emailNotification = await this.notificationService.createNotification({
        userId,
        userEmail,
        channel: 'EMAIL',
        title: `Xác nhận đơn hàng #${payload.orderCode}`,
        body: `Cảm ơn bạn đã đặt hàng! Đơn hàng #${payload.orderCode} đã được xác nhận.`,
        referenceType: 'ORDER',
        referenceId: payload.orderId,
        data: {
          orderCode: payload.orderCode,
          customerName,
          items: payload.items,
          totalAmount: payload.totalAmount,
        },
      });

      try {
        await this.emailService.sendOrderConfirmation(userEmail, payload.orderCode, {
          customerName,
          items: payload.items,
          totalAmount: payload.totalAmount,
        });
        // Chỉ update EMAIL notification (dùng ID cụ thể, không dùng referenceId chung)
        await this.notificationService.updateNotificationStatusById(
          emailNotification.id,
          'SENT',
        );
      } catch (error) {
        this.logger.error('Failed to send order confirmation email:', error);
        await this.notificationService.updateNotificationStatusById(
          emailNotification.id,
          'FAILED',
        );
      }
    }
  }

  private async handleOrderCancelled(payload: OrderEventPayload) {
    const userId = payload.userId;
    const userEmail = payload.userEmail;
    const customerName = payload.userName || payload.customerName || 'Khách hàng';
    const reason = payload.reason || 'Không có lý do được cung cấp';

    await this.notificationService.createNotification({
      userId,
      userEmail,
      channel: 'IN_APP',
      title: `Đơn hàng #${payload.orderCode} đã bị hủy`,
      body: `Đơn hàng #${payload.orderCode} đã bị hủy. Lý do: ${reason}`,
      referenceType: 'ORDER',
      referenceId: payload.orderId,
      data: {
        orderCode: payload.orderCode,
        reason,
        customerName,
      },
    });

    if (userEmail) {
      const emailNotification = await this.notificationService.createNotification({
        userId,
        userEmail,
        channel: 'EMAIL',
        title: `Đơn hàng #${payload.orderCode} đã bị hủy`,
        body: `Đơn hàng #${payload.orderCode} đã bị hủy. Lý do: ${reason}`,
        referenceType: 'ORDER',
        referenceId: payload.orderId,
        data: {
          orderCode: payload.orderCode,
          reason,
          customerName,
        },
      });

      try {
        await this.emailService.sendOrderCancelled(userEmail, payload.orderCode, {
          customerName,
          reason,
        });
        await this.notificationService.updateNotificationStatusById(
          emailNotification.id,
          'SENT',
        );
      } catch (error) {
        this.logger.error('Failed to send order cancellation email:', error);
        await this.notificationService.updateNotificationStatusById(
          emailNotification.id,
          'FAILED',
        );
      }
    }
  }

  // ORDER_STATUS_CHANGED: Spring Boot gửi currentStatus / previousStatus / note
  private async handleOrderStatusChanged(payload: OrderStatusChangedEventPayload) {
    const userId = payload.userId;
    const userEmail = payload.userEmail;
    // currentStatus là enum OrderStatus từ Spring Boot (VD: PENDING, PREPARING, READY, ...)
    const currentStatus = payload.currentStatus || payload.status || 'Cập nhật';
    const previousStatus = payload.previousStatus || '';
    const note = payload.note || '';
    const customerName = payload.userName || payload.customerName || 'Khách hàng';

    const body = note
      ? `Đơn hàng #${payload.orderCode} chuyển sang: ${currentStatus}. ${note}`
      : `Đơn hàng #${payload.orderCode} chuyển sang: ${currentStatus}`;

    await this.notificationService.createNotification({
      userId,
      userEmail,
      channel: 'IN_APP',
      title: `Đơn hàng #${payload.orderCode} - ${currentStatus}`,
      body,
      referenceType: 'ORDER',
      referenceId: payload.orderId,
      data: {
        orderCode: payload.orderCode,
        previousStatus,
        currentStatus,
        note,
        customerName,
      },
    });
  }

  // ORDER_COMPLETED: Spring Boot bắn khi trạng thái chuyển sang COMPLETED
  // Tương đương PAYMENT_SUCCESS trong thiết kế cũ
  private async handleOrderCompleted(payload: OrderCompletedEventPayload) {
    const userId = payload.userId;
    const userEmail = payload.userEmail;
    const customerName = payload.userName || payload.customerName || 'Khách hàng';

    await this.notificationService.createNotification({
      userId,
      userEmail,
      channel: 'IN_APP',
      title: 'Đơn hàng hoàn thành',
      body: `Đơn hàng #${payload.orderCode} đã hoàn thành. Cảm ơn bạn!`,
      referenceType: 'ORDER',
      referenceId: payload.orderId,
      data: {
        orderCode: payload.orderCode,
        customerName,
        totalAmount: payload.totalAmount,
      },
    });

    if (userEmail) {
      const emailNotification = await this.notificationService.createNotification({
        userId,
        userEmail,
        channel: 'EMAIL',
        title: 'Đơn hàng hoàn thành',
        body: `Đơn hàng #${payload.orderCode} đã hoàn thành.`,
        referenceType: 'ORDER',
        referenceId: payload.orderId,
        data: {
          orderCode: payload.orderCode,
          customerName,
          items: payload.items,
          totalAmount: payload.totalAmount,
        },
      });

      try {
        await this.emailService.sendOrderConfirmation(userEmail, payload.orderCode, {
          customerName,
          items: payload.items,
          totalAmount: payload.totalAmount,
          isCompleted: true,
        });
        await this.notificationService.updateNotificationStatusById(
          emailNotification.id,
          'SENT',
        );
      } catch (error) {
        this.logger.error('Failed to send order completed email:', error);
        await this.notificationService.updateNotificationStatusById(
          emailNotification.id,
          'FAILED',
        );
      }
    }
  }

  // ORDER_TIMEOUT: Spring Boot gửi paymentDeadline, expiredAt (không có reason)
  private async handleOrderTimeout(payload: OrderTimeoutEventPayload) {
    const userId = payload.userId;
    const userEmail = payload.userEmail;
    const customerName = payload.userName || payload.customerName || 'Khách hàng';
    const reason = payload.reason || 'Quá hạn thanh toán';

    await this.notificationService.createNotification({
      userId,
      userEmail,
      channel: 'IN_APP',
      title: `Đơn hàng #${payload.orderCode} đã bị hủy`,
      body: `Đơn hàng #${payload.orderCode} đã bị hủy do quá hạn thanh toán.`,
      referenceType: 'ORDER',
      referenceId: payload.orderId,
      data: {
        orderCode: payload.orderCode,
        reason,
        customerName,
        paymentDeadline: payload.paymentDeadline,
        expiredAt: payload.expiredAt,
      },
    });

    if (userEmail) {
      const emailNotification = await this.notificationService.createNotification({
        userId,
        userEmail,
        channel: 'EMAIL',
        title: `Đơn hàng #${payload.orderCode} đã bị hủy do quá hạn thanh toán`,
        body: `Đơn hàng #${payload.orderCode} đã bị hủy do quá hạn thanh toán.`,
        referenceType: 'ORDER',
        referenceId: payload.orderId,
        data: {
          orderCode: payload.orderCode,
          reason,
          customerName,
          paymentDeadline: payload.paymentDeadline,
          expiredAt: payload.expiredAt,
        },
      });

      try {
        await this.emailService.sendOrderTimeout(userEmail, payload.orderCode, customerName);
        await this.notificationService.updateNotificationStatusById(
          emailNotification.id,
          'SENT',
        );
      } catch (error) {
        this.logger.error('Failed to send order timeout email:', error);
        await this.notificationService.updateNotificationStatusById(
          emailNotification.id,
          'FAILED',
        );
      }
    }
  }

  private async handleTierUpgraded(payload: TierUpdateEventPayload) {
    const userId = payload.userId;
    const userEmail = payload.userEmail;
    const customerName = payload.userName || payload.customerName || 'Khách hàng';
    const tier = payload.tier;
    const totalSpent = payload.totalSpent;

    await this.notificationService.createNotification({
      userId,
      userEmail,
      channel: 'IN_APP',
      title: `Chúc mừng bạn lên hạng ${tier}!`,
      body: `Bạn đã đạt hạng ${tier} với tổng chi tiêu ${totalSpent}đ.`,
      referenceType: 'TIER',
      referenceId: userId,
      data: {
        tier,
        totalSpent,
        customerName,
        upgradeDate: new Date().toISOString(),
      },
    });

    if (userEmail) {
      const emailNotification = await this.notificationService.createNotification({
        userId,
        userEmail,
        channel: 'EMAIL',
        title: `Chúc mừng bạn lên hạng ${tier}!`,
        body: `Bạn đã đạt hạng ${tier} với tổng chi tiêu ${totalSpent}đ.`,
        referenceType: 'TIER',
        referenceId: userId,
        data: {
          tier,
          totalSpent,
          customerName,
          upgradeDate: new Date().toISOString(),
        },
      });

      try {
        await this.emailService.sendTierUpgraded(userEmail, tier, String(totalSpent), customerName);
        await this.notificationService.updateNotificationStatusById(
          emailNotification.id,
          'SENT',
        );
      } catch (error) {
        this.logger.error('Failed to send tier upgraded email:', error);
        await this.notificationService.updateNotificationStatusById(
          emailNotification.id,
          'FAILED',
        );
      }
    }
  }
}
