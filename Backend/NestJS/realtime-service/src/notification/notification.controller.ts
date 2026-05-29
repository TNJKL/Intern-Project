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
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';
import { QueryNotificationsDto, PaginatedNotificationsDto } from './dto/notification.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('api/v1/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('admin/all')
  @Roles('ADMIN', 'STAFF')
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'ADMIN/STAFF - Lấy toàn bộ thông báo hệ thống',
    description: 'Chỉ ADMIN hoặc STAFF mới được phép gọi API này. Trả về lỗi 403 nếu vai trò là CUSTOMER.',
  })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công', type: PaginatedNotificationsDto })
  @ApiResponse({ status: 401, description: 'Chưa xác thực (chưa gửi token hoặc token hết hạn)' })
  @ApiResponse({ status: 403, description: 'Không đủ quyền hạn (ví dụ CUSTOMER truy cập)' })
  async getAdminNotifications(@Query() query: QueryNotificationsDto) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '20', 10);
    const isRead = query.isRead !== undefined ? query.isRead === 'true' : undefined;
    return this.notificationService.adminGetAllNotifications(
      page,
      limit,
      query.channel,
      isRead,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'CUSTOMER/ADMIN/STAFF - Lấy danh sách thông báo cá nhân',
    description: 'Lấy danh sách các thông báo của chính người dùng hiện tại đang đăng nhập.',
  })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thông báo thành công', type: PaginatedNotificationsDto })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
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
  @ApiOperation({ summary: 'Lấy số lượng thông báo chưa đọc của cá nhân' })
  @ApiResponse({ status: 200, description: 'Trả về object chứa count' })
  async getUnreadCount(@CurrentUser() user: CurrentUserData) {
    return this.notificationService.getUnreadCount(user.userId);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đánh dấu một thông báo cá nhân là đã đọc' })
  @ApiParam({ name: 'id', description: 'UUID của thông báo' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy thông báo hoặc không thuộc về user này' })
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.notificationService.markAsRead(id, user.userId);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đánh dấu tất cả thông báo cá nhân là đã đọc' })
  @ApiResponse({ status: 200, description: 'Trả về số lượng bản ghi được cập nhật' })
  async markAllAsRead(@CurrentUser() user: CurrentUserData) {
    return this.notificationService.markAllAsRead(user.userId);
  }
}
