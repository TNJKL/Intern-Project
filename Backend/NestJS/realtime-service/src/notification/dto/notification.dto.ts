import { IsOptional, IsString, IsUUID, IsIn } from 'class-validator';

export class CreateNotificationDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  userEmail?: string;

  @IsOptional()
  @IsString()
  referenceType?: string;

  @IsOptional()
  @IsUUID()
  referenceId?: string;

  @IsOptional()
  @IsUUID()
  templateId?: string;

  @IsString()
  @IsIn(['EMAIL', 'SMS', 'PUSH', 'IN_APP'])
  channel: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  data?: Record<string, any>;
}

export class QueryNotificationsDto {
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsString()
  @IsIn(['EMAIL', 'SMS', 'PUSH', 'IN_APP'])
  channel?: string;

  @IsOptional()
  @IsString()
  isRead?: string;
}

export class PaginatedNotificationsDto {
  data: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
