import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('chat_sessions')
export class ChatSession {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  id: string;

  @Column({ name: 'customer_id', type: 'varchar', length: 255 })
  customerId: string;

  @Column({ name: 'customer_name', type: 'varchar', length: 255 })
  customerName: string;

  @Column({ name: 'customer_email', type: 'varchar', length: 255, nullable: true })
  customerEmail: string;

  @Column({ name: 'assigned_admin_id', type: 'varchar', length: 255, nullable: true })
  assignedAdminId: string;

  @Column({ name: 'assigned_admin_name', type: 'varchar', length: 255, nullable: true })
  assignedAdminName: string;

  @CreateDateColumn({ name: 'started_at', type: 'timestamp with time zone' })
  startedAt: Date;

  @Column({ name: 'closed_at', type: 'timestamp with time zone', nullable: true })
  closedAt: Date;

  @Column({ type: 'jsonb', default: [] })
  messages: any[];
}
