import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('processed_events')
export class ProcessedEvent {
  @PrimaryColumn({ name: 'event_id', length: 200 })
  eventId: string;

  @CreateDateColumn({ name: 'processed_at', type: 'timestamptz' })
  processedAt: Date;
}
