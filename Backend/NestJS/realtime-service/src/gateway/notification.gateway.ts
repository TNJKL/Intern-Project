import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards, Inject, forwardRef } from '@nestjs/common';
import { WsJwtGuard } from '../common/guards/ws-jwt.guard';
import { NotificationEmitterService, NotificationPayload } from '../notification/notification-emitter.service';
import { GuestSessionService } from './guest-session.service';

@WebSocketGateway({
  path: '/ws',
  namespace: '/notifications',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);

  constructor(
    @Inject(forwardRef(() => NotificationEmitterService))
    private notificationEmitter: NotificationEmitterService,
    private guestSessionService: GuestSessionService,
  ) {}

  afterInit() {
    this.notificationEmitter.registerHandler((notification: NotificationPayload) => {
      if (notification.userId) {
        // Member đã đăng nhập → emit vào room user:{userId}
        this.emitToUser(notification.userId, notification);
      } else if (notification.data?.orderCode) {
        // Guest → emit vào room order:{orderCode}
        this.emitToOrder(notification.data.orderCode, notification);
      }
    });
    this.logger.log('NotificationGateway initialized with emitter handler');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // ─── Member (JWT) ─────────────────────────────────────────────────────────

  @SubscribeMessage('join')
  @UseGuards(WsJwtGuard)
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    const userId = (client as any).user?.userId;
    if (userId) {
      client.join(`user:${userId}`);
      this.logger.log(`User ${userId} joined room user:${userId}`);
      // Phát trực tiếp sự kiện về client để hiển thị trên Postman (không cần Ack)
      client.emit('joined', { room: `user:${userId}`, success: true });
      return { event: 'joined', room: `user:${userId}`, success: true };
    }
    client.emit('error', { message: 'User not authenticated', success: false });
    return { event: 'error', message: 'User not authenticated', success: false };
  }

  @SubscribeMessage('leave')
  @UseGuards(WsJwtGuard)
  handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    const userId = (client as any).user?.userId;
    if (userId) {
      client.leave(`user:${userId}`);
      this.logger.log(`User ${userId} left room user:${userId}`);
      // Phát trực tiếp sự kiện về client
      client.emit('left', { room: `user:${userId}`, success: true });
      return { event: 'left', room: `user:${userId}`, success: true };
    }
    client.emit('error', { message: 'User not authenticated', success: false });
    return { event: 'error', message: 'User not authenticated', success: false };
  }

  // ─── Guest (Redis guestSessionId) ────────────────────────────────────────

  /**
   * Guest join room theo orderCode sau khi validate guestSessionId qua Redis.
   * Không dùng JWT guard — xác thực thông qua guestSessionId do Order Service cấp.
   */
  @SubscribeMessage('join-guest')
  async handleJoinGuest(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { guestSessionId: string },
  ) {
    const { guestSessionId } = payload || {};

    if (!guestSessionId) {
      client.emit('error', { message: 'guestSessionId is required', success: false });
      return { event: 'error', message: 'guestSessionId is required', success: false };
    }

    const orderCode = await this.guestSessionService.getOrderCode(guestSessionId);

    if (!orderCode) {
      this.logger.warn(`Invalid or expired guestSessionId: ${guestSessionId}`);
      client.emit('error', { message: 'Invalid or expired guest session', success: false });
      return { event: 'error', message: 'Invalid or expired guest session', success: false };
    }

    const room = `order:${orderCode}`;
    client.join(room);
    this.logger.log(`Guest joined room ${room} via session ${guestSessionId}`);
    client.emit('joined-guest', { room, orderCode, success: true });
    return { event: 'joined-guest', room, orderCode, success: true };
  }

  // ─── Emit helpers ─────────────────────────────────────────────────────────

  /** Emit notification tới room của member đã đăng nhập. */
  emitToUser(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification', {
      event: 'notification',
      data: notification,
      timestamp: new Date().toISOString(),
    });
    this.logger.debug(`Emitted notification to user:${userId}`);
  }

  /** Emit notification tới room của guest theo orderCode. */
  emitToOrder(orderCode: string, notification: any) {
    this.server.to(`order:${orderCode}`).emit('notification', {
      event: 'notification',
      data: notification,
      timestamp: new Date().toISOString(),
    });
    this.logger.debug(`Emitted notification to order:${orderCode}`);
  }

  emitToMultipleUsers(userIds: string[], notification: any) {
    userIds.forEach((userId) => {
      this.emitToUser(userId, notification);
    });
  }

  emitToAll(notification: any) {
    this.server.emit('notification', {
      event: 'notification',
      data: notification,
      timestamp: new Date().toISOString(),
    });
  }
}
