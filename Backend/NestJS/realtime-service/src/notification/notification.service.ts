import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto, PaginatedNotificationsDto } from './dto/notification.dto';
import { NotificationEmitterService } from './notification-emitter.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private notificationEmitter: NotificationEmitterService,
  ) {}

  async createNotification(dto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId: dto.userId,
      userEmail: dto.userEmail,
      referenceType: dto.referenceType,
      referenceId: dto.referenceId,
      templateId: dto.templateId,
      channel: dto.channel,
      title: dto.title,
      body: dto.body,
      data: dto.data || {},
      status: 'PENDING',
      isRead: false,
    });

    const saved = await this.notificationRepository.save(notification);

    if (dto.userId && saved.channel === 'IN_APP') {
      this.notificationEmitter.emit({
        id: saved.id,
        userId: saved.userId,
        userEmail: saved.userEmail,
        channel: saved.channel,
        title: saved.title,
        body: saved.body,
        data: saved.data,
        status: saved.status,
        isRead: saved.isRead,
        createdAt: saved.createdAt,
      });
    }

    return saved;
  }

  async adminGetAllNotifications(
    page: number = 1,
    limit: number = 20,
    channel?: string,
    isRead?: boolean,
  ): Promise<PaginatedNotificationsDto> {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (channel) where.channel = channel;
    if (isRead !== undefined) where.isRead = isRead;

    const [data, total] = await this.notificationRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
    channel?: string,
    isRead?: boolean,
  ): Promise<PaginatedNotificationsDto> {
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (channel) where.channel = channel;
    if (isRead !== undefined) where.isRead = isRead;

    const [data, total] = await this.notificationRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.notificationRepository.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification ${id} not found`);
    }

    notification.isRead = true;
    notification.status = 'READ';
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<{ updated: number }> {
    const result = await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true, status: 'READ' },
    );
    return { updated: result.affected || 0 };
  }

  /**
   * Cập nhật status theo notification ID cụ thể.
   * Dùng cho việc update status email notification sau khi gửi.
   */
  async updateNotificationStatusById(
    id: string,
    status: string,
  ): Promise<void> {
    await this.notificationRepository.update(
      { id },
      { status, sentAt: status === 'SENT' ? new Date() : undefined },
    );
  }

  /**
   * @deprecated Dùng updateNotificationStatusById thay thế để tránh update nhầm channel.
   * Giữ lại để tương thích nếu cần.
   */
  async updateNotificationStatusByRef(
    referenceId: string,
    status: string,
    channel: string = 'EMAIL',
  ): Promise<void> {
    await this.notificationRepository.update(
      { referenceId, channel },
      { status, sentAt: status === 'SENT' ? new Date() : undefined },
    );
  }

  async deleteOldNotifications(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.notificationRepository.delete({
      createdAt: LessThan(cutoffDate),
      isRead: true,
    });

    return result.affected || 0;
  }
}
