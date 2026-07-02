import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

export interface SendEmailOptions {
  to: string;
  subject: string;
  template?: string;
  context?: Record<string, any>;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private mailerService: MailerService) {}

  async send(options: SendEmailOptions): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: options.to,
        subject: options.subject,
        template: options.template,
        context: options.context,
        text: options.text,
      });
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      throw error;
    }
  }

  async sendOrderConfirmation(
    email: string,
    orderCode: string,
    data: Record<string, any>,
  ): Promise<void> {
    await this.send({
      to: email,
      subject: `Xác nhận đơn hàng #${orderCode}`,
      template: 'order-confirmation',
      context: { orderCode, ...data },
    });
  }

  /**
   * Email hủy đơn do timeout / quá hạn thanh toán.
   * @param customerName - Tên khách hàng (userName từ Spring Boot)
   */
  async sendOrderTimeout(
    email: string,
    orderCode: string,
    customerName: string,
  ): Promise<void> {
    await this.send({
      to: email,
      subject: `Đơn hàng #${orderCode} đã bị hủy`,
      template: 'order-timeout',
      context: { orderCode, customerName },
    });
  }

  /**
   * Email thông báo hủy đơn do người dùng / admin hủy.
   * Dùng template order-cancelled riêng biệt với order-timeout.
   */
  async sendOrderCancelled(
    email: string,
    orderCode: string,
    data: { customerName: string; reason: string },
  ): Promise<void> {
    await this.send({
      to: email,
      subject: `Thông báo hủy đơn hàng #${orderCode}`,
      template: 'order-cancelled',
      context: { orderCode, ...data },
    });
  }

  /**
   * Email thông báo đơn hàng giao thành công.
   * @param isGuest - true nếu là khách vãng lai (guest), false nếu là member đã đăng ký
   */
  async sendOrderCompleted(
    email: string,
    orderCode: string,
    data: { customerName: string; isGuest?: boolean },
  ): Promise<void> {
    await this.send({
      to: email,
      subject: `Đơn hàng #${orderCode} đã giao thành công`,
      template: 'order-completed',
      context: { orderCode, ...data },
    });
  }

  async sendTierUpgraded(
    email: string,
    tier: string,
    totalSpent: string,
    customerName: string,
    totalOrders: number,
    upgradeDate?: string,
  ): Promise<void> {
    const formattedDate = upgradeDate
      ? new Date(upgradeDate).toLocaleDateString('vi-VN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : new Date().toLocaleDateString('vi-VN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });

    await this.send({
      to: email,
      subject: `Chúc mừng bạn lên hạng ${tier}!`,
      template: 'tier-upgraded',
      context: { tier, totalSpent, totalOrders, customerName, upgradeDate: formattedDate },
    });
  }

  /**
   * Email cảnh báo tồn kho thấp gửi cho admin.
   * Chỉ gửi khi alertLevel là CRITICAL hoặc OUT_OF_STOCK.
   * Template: low-stock-alert (sử dụng handlebars nếu có, fallback text)
   *
   * @param adminEmail   - Email của admin (lấy từ ADMIN_ALERT_EMAIL env)
   * @param data         - Thông tin nguyên liệu và ngưỡng cảnh báo
   */
  async sendLowStockAlert(
    adminEmail: string,
    data: {
      ingredientName: string;
      currentStock: number;
      unit: string;
      lowStockThreshold: number;
      criticalAbsolute: number;
      criticalPct: number;
      alertLevel: 'CRITICAL' | 'OUT_OF_STOCK';
    },
  ): Promise<void> {
    const isOutOfStock = data.alertLevel === 'OUT_OF_STOCK';
    const subject = isOutOfStock
      ? `🔴 KHẨN CẤP: ${data.ingredientName} đã hết hàng`
      : `⚠️ Cảnh báo kho: ${data.ingredientName} gần hết hàng`;

    await this.send({
      to: adminEmail,
      subject,
      template: 'low-stock-alert',
      context: {
        ...data,
        isOutOfStock,
        isCritical: data.alertLevel === 'CRITICAL',
        timestamp: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      },
    });
  }
}
