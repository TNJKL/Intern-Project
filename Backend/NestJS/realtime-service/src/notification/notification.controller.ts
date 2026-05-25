import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';
import { QueryNotificationsDto } from './dto/notification.dto';

@Controller('api/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getNotifications(
    @CurrentUser() user: CurrentUserData,
    @Query() query: QueryNotificationsDto,
  ) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '20', 10);
    const isRead = query.isRead !== undefined ? query.isRead === 'true' : undefined;
    return this.notificationService.getUserNotifications(
      user.userId,
      page,
      limit,
      query.channel,
      isRead,
    );
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: CurrentUserData) {
    return this.notificationService.getUnreadCount(user.userId);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.notificationService.markAsRead(id, user.userId);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@CurrentUser() user: CurrentUserData) {
    return this.notificationService.markAllAsRead(user.userId);
  }
}
