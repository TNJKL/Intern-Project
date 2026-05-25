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

  async sendTierUpgraded(
    email: string,
    tier: string,
    totalSpent: string,
    customerName: string,
  ): Promise<void> {
    await this.send({
      to: email,
      subject: `Chúc mừng bạn lên hạng ${tier}!`,
      template: 'tier-upgraded',
      context: { tier, totalSpent, customerName },
    });
  }
}
