import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KafkaConsumerService } from './kafka-consumer.service';
import { EventsService } from './events.service';
import { ProcessedEvent } from './entities/processed-event.entity';
import { NotificationModule } from '../notification/notification.module';
import { EmailModule } from '../email/email.module';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProcessedEvent]),
    NotificationModule,
    EmailModule,
    forwardRef(() => GatewayModule),
  ],
  providers: [KafkaConsumerService, EventsService],
  exports: [EventsService],
})
export class EventsModule {}
