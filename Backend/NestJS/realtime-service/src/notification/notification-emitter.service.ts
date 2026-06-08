import { Injectable } from '@nestjs/common';

export interface NotificationPayload {
  id: string;
  userId?: string;
  userEmail?: string;
  referenceType?: string;
  channel: string;
  title: string;
  body?: string;
  data?: Record<string, any>;
  status: string;
  isRead: boolean;
  createdAt: Date;
}

@Injectable()
export class NotificationEmitterService {
  private handlers: Array<(notification: NotificationPayload) => void> = [];

  registerHandler(handler: (notification: NotificationPayload) => void) {
    this.handlers.push(handler);
  }

  unregisterHandler(handler: (notification: NotificationPayload) => void) {
    const index = this.handlers.indexOf(handler);
    if (index > -1) {
      this.handlers.splice(index, 1);
    }
  }

  emit(notification: NotificationPayload) {
    this.handlers.forEach((handler) => {
      try {
        handler(notification);
      } catch (error) {
        console.error('Error in notification handler:', error);
      }
    });
  }
}
