import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationEmitterService } from './notification-emitter.service';
import { Notification } from './entities/notification.entity';
import { NotificationTemplate } from './entities/notification-template.entity';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, NotificationTemplate]),
    forwardRef(() => GatewayModule),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationEmitterService],
  exports: [NotificationService, NotificationEmitterService],
})
export class NotificationModule {}
