import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { NotificationService } from '../notification/notification.service';
import { EmailService } from '../email/email.service';
import { GuestSessionService } from '../gateway/guest-session.service';
import {
  OrderEventPayload,
  OrderCompletedEventPayload,
  OrderStatusChangedEventPayload,
  OrderTimeoutEventPayload,
  TierUpdateEventPayload,
} from './dto/order-events.dto';
import { LowStockAlertPayload } from './dto/inventory-events.dto';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private notificationService: NotificationService,
    private emailService: EmailService,
    @Inject(forwardRef(() => GuestSessionService))
    private guestSessionService: GuestSessionService,
  ) { }

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

  /**
   * Xử lý event từ inventory-events topic.
   * Hiện tại chỉ handle LOW_STOCK_ALERT từ LowStockAlertService.
   */
  async processInventoryEvent(eventType: string, payload: any) {
    switch (eventType) {
      case 'LOW_STOCK_ALERT':
        await this.handleLowStockAlert(payload as LowStockAlertPayload);
        break;
      default:
        this.logger.warn(`Unknown inventory event type: ${eventType}`);
    }
  }

  /**
   * Xử lý LOW_STOCK_ALERT event từ inventory-service.
   *
   * Logic theo mức độ:
   *  - LOW          → chỉ IN_APP notification cho admin (không email)
   *  - CRITICAL     → IN_APP + Email admin một lần
   *  - OUT_OF_STOCK → IN_APP + Email admin khẩn cấp
   *
   * Admin email được lấy từ ADMIN_ALERT_EMAIL env (hoặc ADMIN_EMAIL fallback).
   * Không có userId — thông báo gửi theo email admin.
   */
  private async handleLowStockAlert(payload: LowStockAlertPayload) {
    const adminEmail = process.env.ADMIN_ALERT_EMAIL || process.env.ADMIN_EMAIL || process.env.MAIL_USER;
    if (!process.env.ADMIN_ALERT_EMAIL && !process.env.ADMIN_EMAIL && process.env.MAIL_USER) {
      this.logger.warn(`ADMIN_ALERT_EMAIL not set, falling back to MAIL_USER: ${adminEmail}`);
    }
    const { alertLevel, ingredientName, currentStock, unit, lowStockThreshold, criticalAbsolute, criticalPct } = payload;

    this.logger.log(`Handling LOW_STOCK_ALERT: ingredient=${ingredientName}, level=${alertLevel}, stock=${currentStock}${unit}`);

    // Tạo nội dung IN_APP notification theo mức độ
    let title: string;
    let body: string;

    if (alertLevel === 'OUT_OF_STOCK') {
      title = `🔴 [Kho] ${ingredientName} đã HẾT HÀNG`;
      body = `Nguyên liệu ${ingredientName} đã hết hoàn toàn (0 ${unit}). Sản phẩm liên quan đã tự động bị ẩn. Nhập kho ngay!`;
    } else if (alertLevel === 'CRITICAL') {
      title = `⚠️ [Kho] ${ingredientName} gần hết!`;
      body = `Nguyên liệu ${ingredientName} còn ${currentStock} ${unit} — dưới ngưỡng nghiêm trọng (${criticalAbsolute} ${unit}). Vui lòng nhập kho ngay!`;
    } else {
      // LOW
      title = `[Kho] ${ingredientName} sắp hết hàng`;
      body = `Nguyên liệu ${ingredientName} còn ${currentStock} ${unit} — sắp đến ngưỡng cảnh báo (${lowStockThreshold} ${unit}).`;
    }

    // Luôn tạo IN_APP notification
    await this.notificationService.createNotification({
      userId: null,          // Không có userId — đây là alert nội bộ cho admin
      userEmail: adminEmail, // Admin nhận qua email
      channel: 'IN_APP',
      title,
      body,
      referenceType: 'INGREDIENT',
      referenceId: payload.ingredientId,
      data: {
        ingredientId: payload.ingredientId,
        ingredientName,
        currentStock,
        unit,
        lowStockThreshold,
        criticalAbsolute,
        criticalPct,
        alertLevel,
        occurredAt: payload.occurredAt,
      },
    });

    this.logger.log(`IN_APP notification created for LOW_STOCK_ALERT [${alertLevel}]: ${ingredientName}`);

    // Gửi email cho CRITICAL và OUT_OF_STOCK (không gửi cho LOW)
    if ((alertLevel === 'CRITICAL' || alertLevel === 'OUT_OF_STOCK') && adminEmail) {
      const emailNotification = await this.notificationService.createNotification({
        userId: null,
        userEmail: adminEmail,
        channel: 'EMAIL',
        title,
        body,
        referenceType: 'INGREDIENT',
        referenceId: payload.ingredientId,
        data: {
          ingredientId: payload.ingredientId,
          ingredientName,
          currentStock,
          unit,
          lowStockThreshold,
          criticalAbsolute,
          criticalPct,
          alertLevel,
        },
      });

      try {
        await this.emailService.sendLowStockAlert(adminEmail, {
          ingredientName,
          currentStock,
          unit,
          lowStockThreshold,
          criticalAbsolute,
          criticalPct,
          alertLevel,
        });
        await this.notificationService.updateNotificationStatusById(emailNotification.id, 'SENT');
        this.logger.log(`Email alert sent to admin (${adminEmail}) for ingredient: ${ingredientName} [${alertLevel}]`);
      } catch (error) {
        this.logger.error(`Failed to send low stock alert email for ${ingredientName}:`, error);
        await this.notificationService.updateNotificationStatusById(emailNotification.id, 'FAILED');
      }
    } else if ((alertLevel === 'CRITICAL' || alertLevel === 'OUT_OF_STOCK') && !adminEmail) {
      this.logger.warn(
        `ADMIN_ALERT_EMAIL not configured — skipping email for LOW_STOCK_ALERT [${alertLevel}] ingredient: ${ingredientName}. ` +
        `Set ADMIN_ALERT_EMAIL or ADMIN_EMAIL env variable to enable email alerts.`
      );
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
          discountAmount: payload.discountAmount,
        },
      });

      try {
        const formatMoney = (amount: number | string | undefined): string => {
          if (amount === undefined || amount === null) return '';
          const num = typeof amount === 'string' ? parseFloat(amount) : amount;
          if (isNaN(num)) return String(amount);
          return num.toLocaleString('vi-VN') + ' đ';
        };

        const formattedItems = payload.items?.map(item => ({
          ...item,
          unitPrice: formatMoney(item.unitPrice),
          subtotal: formatMoney(item.subtotal),
          toppings: item.toppings?.map(t => ({
            ...t,
            unitPrice: formatMoney(t.unitPrice)
          }))
        })) || [];

        const formattedTotalAmount = formatMoney(payload.totalAmount);
        const discountVal = typeof payload.discountAmount === 'string' ? parseFloat(payload.discountAmount) : (payload.discountAmount || 0);
        const formattedDiscount = discountVal > 0 ? formatMoney(discountVal) : null;

        await this.emailService.sendOrderConfirmation(userEmail, payload.orderCode, {
          customerName,
          items: formattedItems,
          totalAmount: formattedTotalAmount,
          discountAmount: formattedDiscount,
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

    // Revoke guest session — đơn đã hủy, không cần theo dõi nữa
    await this.guestSessionService.revokeByOrderCode(payload.orderCode);
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
        currentStatus: 'COMPLETED',
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
        // Guest: userId không tồn tại hoặc là null → isGuest = true
        const isGuest = !payload.userId;
        await this.emailService.sendOrderCompleted(userEmail, payload.orderCode, {
          customerName,
          isGuest,
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

    // Revoke guest session — đơn đã hoàn thành, không cần theo dõi nữa
    await this.guestSessionService.revokeByOrderCode(payload.orderCode);
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

    // Revoke guest session — đơn timeout/hủy tự động, không cần theo dõi nữa
    await this.guestSessionService.revokeByOrderCode(payload.orderCode);
  }

  private async handleTierUpgraded(payload: TierUpdateEventPayload) {
    const userId = payload.userId;
    const userEmail = payload.userEmail;
    const customerName = payload.userName || payload.customerName || 'Khách hàng';

    // Ánh xạ tên hạng thành tiếng Việt thân thiện
    const tierMap = {
      'GUEST': 'Khách hàng',
      'MEMBER': 'Khách hàng thân thiết',
      'VIP': 'Khách VIP'
    };
    const rawTier = payload.tier;
    const tier = tierMap[rawTier] || rawTier;
    const totalSpent = payload.totalSpent;
    const totalOrders = payload.totalOrders || 0;
    const upgradeDate = payload.occurredAt || new Date().toISOString();

    await this.notificationService.createNotification({
      userId,
      userEmail,
      channel: 'IN_APP',
      title: `Chúc mừng bạn lên hạng ${tier}!`,
      body: `Bạn đã đạt hạng ${tier} với tổng chi tiêu ${new Intl.NumberFormat("vi-VN").format(Number(totalSpent))}đ và ${totalOrders} đơn hàng đã mua.`,
      referenceType: 'TIER',
      referenceId: userId,
      data: {
        tier,
        rawTier,
        totalSpent,
        totalOrders,
        customerName,
        upgradeDate,
      },
    });

    if (userEmail) {
      const emailNotification = await this.notificationService.createNotification({
        userId,
        userEmail,
        channel: 'EMAIL',
        title: `Chúc mừng bạn lên hạng ${tier}!`,
        body: `Bạn đã đạt hạng ${tier} với tổng chi tiêu ${new Intl.NumberFormat("vi-VN").format(Number(totalSpent))}đ và ${totalOrders} đơn hàng đã mua.`,
        referenceType: 'TIER',
        referenceId: userId,
        data: {
          tier,
          rawTier,
          totalSpent,
          totalOrders,
          customerName,
          upgradeDate,
        },
      });

      try {
        await this.emailService.sendTierUpgraded(
          userEmail,
          tier,
          new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(totalSpent)),
          customerName,
          totalOrders,
          upgradeDate
        );
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
