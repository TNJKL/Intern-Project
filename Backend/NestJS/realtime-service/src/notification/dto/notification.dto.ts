import { IsOptional, IsString, IsUUID, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiPropertyOptional({ description: 'UUID của User nhận thông báo (cho IN_APP)' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Email của User nhận thông báo (cho EMAIL)' })
  @IsOptional()
  @IsString()
  userEmail?: string;

  @ApiPropertyOptional({ description: 'Loại thực thể liên quan (ví dụ: ORDER)' })
  @IsOptional()
  @IsString()
  referenceType?: string;

  @ApiPropertyOptional({ description: 'UUID của thực thể liên quan' })
  @IsOptional()
  @IsUUID()
  referenceId?: string;

  @ApiPropertyOptional({ description: 'UUID của template nội dung thông báo' })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiProperty({ description: 'Kênh gửi thông báo', enum: ['EMAIL', 'SMS', 'PUSH', 'IN_APP'] })
  @IsString()
  @IsIn(['EMAIL', 'SMS', 'PUSH', 'IN_APP'])
  channel: string;

  @ApiProperty({ description: 'Tiêu đề thông báo', example: 'Đơn hàng đã được xác nhận' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Nội dung chi tiết của thông báo' })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({ description: 'Dữ liệu metadata dạng JSON', example: {} })
  @IsOptional()
  data?: Record<string, any>;
}

export class QueryNotificationsDto {
  @ApiPropertyOptional({ description: 'Số trang cần lấy', default: '1' })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({ description: 'Số lượng bản ghi trên một trang', default: '20' })
  @IsOptional()
  @IsString()
  limit?: string;

  @ApiPropertyOptional({ description: 'Lọc theo kênh gửi thông báo', enum: ['EMAIL', 'SMS', 'PUSH', 'IN_APP'] })
  @IsOptional()
  @IsString()
  @IsIn(['EMAIL', 'SMS', 'PUSH', 'IN_APP'])
  channel?: string;

  @ApiPropertyOptional({ description: 'Lọc theo trạng thái đã đọc hay chưa (true/false)' })
  @IsOptional()
  @IsString()
  isRead?: string;
}

export class PaginatedNotificationsDto {
  @ApiProperty({ description: 'Danh sách các thông báo', type: Array })
  data: any[];

  @ApiProperty({ description: 'Tổng số bản ghi' })
  total: number;

  @ApiProperty({ description: 'Trang hiện tại' })
  page: number;

  @ApiProperty({ description: 'Giới hạn số bản ghi mỗi trang' })
  limit: number;

  @ApiProperty({ description: 'Tổng số trang' })
  totalPages: number;
}
