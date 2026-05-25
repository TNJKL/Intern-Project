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

@WebSocketGateway({
  namespace: '/ws/notifications',
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
  ) {}

  afterInit() {
    this.notificationEmitter.registerHandler((notification: NotificationPayload) => {
      if (notification.userId) {
        this.emitToUser(notification.userId, notification);
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
      return { event: 'joined', room: `user:${userId}`, success: true };
    }
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
      return { event: 'left', room: `user:${userId}`, success: true };
    }
    return { event: 'error', message: 'User not authenticated', success: false };
  }

  emitToUser(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification', {
      event: 'notification',
      data: notification,
      timestamp: new Date().toISOString(),
    });
    this.logger.debug(`Emitted notification to user:${userId}`);
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
