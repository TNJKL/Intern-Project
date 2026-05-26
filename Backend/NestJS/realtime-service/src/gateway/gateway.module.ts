import { Module, forwardRef } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';
import { GuestSessionService } from './guest-session.service';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    forwardRef(() => NotificationModule),
  ],
  providers: [NotificationGateway, GuestSessionService],
  exports: [NotificationGateway, GuestSessionService],
})
export class GatewayModule {}
