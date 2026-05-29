import { Module, forwardRef } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';
import { GuestSessionService } from './guest-session.service';
import { WsRateLimiterService } from './ws-rate-limiter.service';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    forwardRef(() => NotificationModule),
  ],
  providers: [NotificationGateway, GuestSessionService, WsRateLimiterService],
  exports: [NotificationGateway, GuestSessionService, WsRateLimiterService],
})
export class GatewayModule {}
