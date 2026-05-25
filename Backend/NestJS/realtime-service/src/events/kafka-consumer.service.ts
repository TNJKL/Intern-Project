import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { Kafka, Consumer, EachMessagePayload, KafkaConfig } from 'kafkajs';
import { EventsService } from './events.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProcessedEvent } from './entities/processed-event.entity';

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private kafka: Kafka;
  private consumer: Consumer;
  private readonly TOPICS = ['order-events', 'order-timeout-events'];
  private readonly GROUP_ID = 'notification-service-group';
  private isConnected = false;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 10;
  private readonly BASE_RECONNECT_DELAY_MS = 1000;
  private readonly MAX_MESSAGE_RETRIES = 3;

  constructor(
    private eventsService: EventsService,
    @InjectRepository(ProcessedEvent)
    private processedEventRepository: Repository<ProcessedEvent>,
  ) {
    const kafkaConfig: KafkaConfig = {
      clientId: 'notification-service',
      brokers: [
        process.env.KAFKA_BOOTSTRAP_SERVERS || 'localhost:9092',
      ],
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
      logLevel: 2,
    };

    this.kafka = new Kafka(kafkaConfig);
    this.consumer = this.kafka.consumer({
      groupId: this.GROUP_ID,
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
    });
  }

  async onModuleInit() {
    await this.connectWithRetry();
  }

  private async connectWithRetry(): Promise<void> {
    while (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
      try {
        this.logger.log(`Kafka connection attempt ${this.reconnectAttempts + 1}/${this.MAX_RECONNECT_ATTEMPTS}...`);

        await this.consumer.connect();
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.logger.log('Kafka consumer connected successfully');

        for (const topic of this.TOPICS) {
          await this.consumer.subscribe({ topic, fromBeginning: false });
          this.logger.log(`Subscribed to topic: ${topic}`);
        }

        await this.startConsuming();
        return;
      } catch (error) {
        this.reconnectAttempts++;
        const delay = this.calculateBackoffDelay();

        this.logger.error(
          `Failed to connect to Kafka (attempt ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS}): ${error.message}`
        );

        if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
          this.logger.log(`Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    this.logger.error(
      'Max reconnection attempts reached. Kafka consumer will not process messages until restarted.'
    );
    this.logger.warn('Service will continue running but Kafka events will not be consumed.');
  }

  private calculateBackoffDelay(): number {
    const delay = Math.min(
      this.BASE_RECONNECT_DELAY_MS * Math.pow(2, this.reconnectAttempts),
      30000
    );
    return delay + Math.random() * 1000;
  }

  private async startConsuming(): Promise<void> {
    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        await this.handleMessageWithRetry(payload);
      },
    });
  }

  private async handleMessageWithRetry(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.MAX_MESSAGE_RETRIES; attempt++) {
      try {
        await this.handleMessage(payload);
        return;
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `Message processing failed (attempt ${attempt}/${this.MAX_MESSAGE_RETRIES}): ${error.message}`
        );

        if (attempt < this.MAX_MESSAGE_RETRIES) {
          const delay = this.BASE_RECONNECT_DELAY_MS * attempt;
          await this.sleep(delay);
        }
      }
    }

    this.logger.error(
      `Message processing failed after ${this.MAX_MESSAGE_RETRIES} attempts. ` +
      `Topic: ${topic}, Partition: ${partition}, Offset: ${message.offset}. ` +
      `Event will NOT be retried. Manual intervention may be required.`
    );

    await this.logFailedMessage(payload, lastError);
  }

  private async logFailedMessage(payload: EachMessagePayload, error: Error | null): Promise<void> {
    const { topic, partition, message } = payload;
    const failedEvent = {
      topic,
      partition,
      offset: message.offset,
      key: message.key?.toString(),
      value: message.value?.toString(),
      error: error?.message,
      failedAt: new Date().toISOString(),
    };

    this.logger.error('FAILED_MESSAGE_FOR_REPLAY:', JSON.stringify(failedEvent, null, 2));
  }

  private async handleMessage(payload: EachMessagePayload) {
    const { topic, partition, message } = payload;

    const value = message.value?.toString();
    if (!value) {
      this.logger.warn('Received empty message, skipping');
      return;
    }

    // Dùng Kafka coordinates (topic:partition:offset) làm idempotency key
    // Đảm bảo luôn unique và ổn định dù message được retry
    const eventId = this.generateEventId(topic, partition, message.offset);

    const isProcessed = await this.isEventProcessed(eventId);
    if (isProcessed) {
      this.logger.debug(`Event ${eventId} already processed, skipping`);
      return;
    }

    let data: any;
    try {
      data = JSON.parse(value);
    } catch (e) {
      this.logger.error(`Failed to parse message JSON at ${eventId}: ${e.message}`);
      return; // malformed message, không retry
    }

    this.logger.log(`Processing event: ${data.eventType} (${eventId}) from topic: ${topic}`);

    await this.eventsService.processOrderEvent(data.eventType, data);

    await this.markEventProcessed(eventId);
    this.logger.log(`Event ${eventId} (type: ${data.eventType}) processed successfully`);
  }

  /**
   * Dùng Kafka coordinates làm idempotency key thay vì timestamp.
   * topic:partition:offset là globally unique và ổn định khi retry.
   */
  private generateEventId(topic: string, partition: number, offset: string): string {
    return `${topic}:${partition}:${offset}`;
  }

  private async isEventProcessed(eventId: string): Promise<boolean> {
    try {
      const event = await this.processedEventRepository.findOne({
        where: { eventId },
      });
      return !!event;
    } catch (error) {
      this.logger.error('Error checking processed event:', error);
      return false;
    }
  }

  private async markEventProcessed(eventId: string): Promise<void> {
    try {
      // Dùng INSERT ... ON CONFLICT DO NOTHING để tránh throw duplicate key
      // trong trường hợp race condition (2 consumer instance xử lý cùng lúc)
      await this.processedEventRepository
        .createQueryBuilder()
        .insert()
        .into(ProcessedEvent)
        .values({ eventId: eventId, processedAt: new Date() })
        .orIgnore() // ON CONFLICT DO NOTHING
        .execute();
    } catch (error) {
      this.logger.error('Error marking event as processed:', error);
      // Không re-throw: nếu fail do race condition, message đã được xử lý
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async onModuleDestroy() {
    try {
      if (this.isConnected) {
        await this.consumer.disconnect();
        this.logger.log('Kafka consumer disconnected gracefully');
      }
    } catch (error) {
      this.logger.error('Error disconnecting Kafka consumer:', error);
    }
  }

  async healthCheck(): Promise<{ connected: boolean; attempts: number }> {
    return {
      connected: this.isConnected,
      attempts: this.reconnectAttempts,
    };
  }
}
