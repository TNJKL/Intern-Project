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
import { WsRateLimiterService } from './ws-rate-limiter.service';
import { ConfigService } from '@nestjs/config';

// Rate limit config cho WebSocket events
const WS_RATE_LIMIT = {
  // Layer 1 — Connection (IP-based): tối đa 10 kết nối mới từ 1 IP trong 60 giây
  // Chặn spam kết nối và join-no-token trước khi bất kỳ guard nào chạy
  CONN_MAX_PER_IP: 10,
  CONN_WINDOW_MS: 60_000,

  // Layer 2 — Event (socketId-based): tối đa 5 lần gửi event join trong 30 giây
  JOIN_MAX_ATTEMPTS: 5,
  JOIN_WINDOW_MS: 30_000,
} as const;

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
    private wsRateLimiter: WsRateLimiterService,
    private configService: ConfigService,
  ) { }

  afterInit() {
    this.notificationEmitter.registerHandler((notification: NotificationPayload) => {
      // 1. Gửi cho Customer
      if (notification.userId) {
        this.emitToUser(notification.userId, notification);
      } else if (notification.data?.orderCode) {
        this.emitToOrder(notification.data.orderCode, notification);
      }

      // 2. Gửi thêm cho Admin nếu là thông báo liên quan đến đơn hàng
      if (notification.referenceType === 'ORDER') {
        this.emitToAdminOrders(notification);
      }

      // 3. Gửi cảnh báo tồn kho
      if (notification.referenceType === 'INGREDIENT') {
        this.emitToAdminAlerts(notification);
      }
    });
    this.logger.log('NotificationGateway initialized with emitter handler');
  }

  handleConnection(client: Socket) {
    // Layer 1: IP-based connection rate limit
    // Xử lý trước mọi event handler — bắt được cả spam join-no-token
    const clientIp =
      (client.handshake.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      client.handshake.address;

    if (
      this.wsRateLimiter.isConnectionRateLimited(
        clientIp,
        WS_RATE_LIMIT.CONN_MAX_PER_IP,
        WS_RATE_LIMIT.CONN_WINDOW_MS,
      )
    ) {
      this.logger.warn(`Connection rate limit exceeded for IP ${clientIp}. Disconnecting ${client.id}.`);
      client.emit('error', {
        message: 'Too many connections. Please try again later.',
        code: 'CONNECTION_RATE_LIMITED',
        success: false,
      });
      client.disconnect(true);
      return;
    }

    this.logger.log(`Client connected: ${client.id} from ${clientIp}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Dọn dẹp rate limit entries để tránh memory leak khi client disconnect
    this.wsRateLimiter.clearSocket(client.id);
  }

  // ─── Member (JWT) ─────────────────────────────────────────────────────────

  @SubscribeMessage('join')
  @UseGuards(WsJwtGuard)
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    // Rate limiting: tối đa 5 lần join trong 30 giây
    if (
      this.wsRateLimiter.isRateLimited(
        client.id,
        'join',
        WS_RATE_LIMIT.JOIN_MAX_ATTEMPTS,
        WS_RATE_LIMIT.JOIN_WINDOW_MS,
      )
    ) {
      const info = this.wsRateLimiter.getRateLimitInfo(
        client.id,
        'join',
        WS_RATE_LIMIT.JOIN_MAX_ATTEMPTS,
      );
      client.emit('error', {
        message: `Too many join attempts. Try again in ${info.resetInSeconds}s.`,
        code: 'RATE_LIMITED',
        retryAfter: info.resetInSeconds,
        success: false,
      });
      return;
    }

    const userId = (client as any).user?.userId;
    const role = (client as any).user?.role?.toUpperCase();
    if (userId) {
      client.join(`user:${userId}`);
      this.logger.log(`User ${userId} joined room user:${userId}`);

      // Admin/Staff tự động join vào room admin:orders để nhận các update đơn hàng
      const isAdmin = role === 'ADMIN' || role === 'STAFF';
      if (isAdmin) {
        client.join('admin:orders');
        this.logger.log(`Admin/Staff ${userId} joined room admin:orders`);
      }

      // Phát trực tiếp sự kiện về client để hiển thị trên Postman (không cần Ack)
      client.emit('joined', { room: `user:${userId}`, success: true });
      this.checkAndEmitPendingRepayment(client, { userId });
      return { success: true };
    }
    client.emit('error', { message: 'User not authenticated', success: false });
    return { success: false, message: 'User not authenticated' };
  }

  @SubscribeMessage('leave')
  @UseGuards(WsJwtGuard)
  handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    const userId = (client as any).user?.userId;
    const role = (client as any).user?.role?.toUpperCase();
    if (userId) {
      client.leave(`user:${userId}`);
      this.logger.log(`User ${userId} left room user:${userId}`);

      const isAdmin = role === 'ADMIN' || role === 'STAFF';
      if (isAdmin) {
        client.leave('admin:orders');
        this.logger.log(`Admin/Staff ${userId} left room admin:orders`);
      }

      // Phát trực tiếp sự kiện về client
      client.emit('left', { room: `user:${userId}`, success: true });
      return { success: true };
    }
    client.emit('error', { message: 'User not authenticated', success: false });
    return { success: false, message: 'User not authenticated' };
  }

  @SubscribeMessage('check-pending-repayment')
  async handleCheckPendingRepayment(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { guestSessionId?: string },
  ) {
    const userId = (client as any).user?.userId;
    if (userId) {
      this.logger.log(`Checking pending repayment for Member ${userId} on client request`);
      this.checkAndEmitPendingRepayment(client, { userId });
      return { success: true };
    }

    const { guestSessionId } = payload || {};
    if (guestSessionId) {
      const orderCode = await this.guestSessionService.getOrderCode(guestSessionId);
      if (orderCode) {
        this.logger.log(`Checking pending repayment for Guest via guestSessionId ${guestSessionId} on client request`);
        this.checkAndEmitPendingRepayment(client, { orderCode });
        return { success: true };
      }
    }

    this.logger.warn(`Check pending repayment requested by client ${client.id} but no userId or valid guestSessionId found`);
    return { success: false, message: 'No authenticated user or valid guestSessionId' };
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
    // Rate limiting: tối đa 5 lần join-guest trong 30 giây
    if (
      this.wsRateLimiter.isRateLimited(
        client.id,
        'join-guest',
        WS_RATE_LIMIT.JOIN_MAX_ATTEMPTS,
        WS_RATE_LIMIT.JOIN_WINDOW_MS,
      )
    ) {
      const info = this.wsRateLimiter.getRateLimitInfo(
        client.id,
        'join-guest',
        WS_RATE_LIMIT.JOIN_MAX_ATTEMPTS,
      );
      client.emit('error', {
        message: `Too many join-guest attempts. Try again in ${info.resetInSeconds}s.`,
        code: 'RATE_LIMITED',
        retryAfter: info.resetInSeconds,
        success: false,
      });
      return;
    }

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
    this.checkAndEmitPendingRepayment(client, { orderCode });
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

  /** Emit notification tới room admin:orders cho tất cả admin online. */
  emitToAdminOrders(notification: any) {
    let adminTitle = notification.title;
    let adminBody = notification.body;

    const orderCode = notification.data?.orderCode;
    const customerName = notification.data?.customerName || 'Khách hàng';

    // Nhận diện và tùy biến thông báo phù hợp cho Admin
    if (notification.title?.includes('đã được tạo') || notification.data?.status === 'CREATED') {
      adminTitle = 'Có đơn hàng mới!';
      adminBody = `Khách hàng ${customerName} vừa đặt đơn hàng #${orderCode}.`;
    } else if (notification.title?.includes('hoàn thành') || notification.title?.includes('COMPLETED')) {
      adminTitle = 'Đơn hàng hoàn thành';
      adminBody = `Đơn hàng #${orderCode} của ${customerName} đã hoàn thành và giao thành công.`;
    } else if (notification.title?.includes('đã bị hủy') || notification.title?.includes('CANCELLED')) {
      const reason = notification.data?.reason || 'Yêu cầu hủy';
      adminTitle = 'Đơn hàng đã bị hủy';
      adminBody = `Đơn hàng #${orderCode} của ${customerName} đã bị hủy (${reason}).`;
    } else if (notification.data?.currentStatus) {
      const statusLabel = notification.data.currentStatus;
      adminTitle = `Cập nhật đơn hàng #${orderCode}`;
      adminBody = `Đơn hàng chuyển sang trạng thái: ${statusLabel}.`;
    }

    this.server.to('admin:orders').emit('notification', {
      event: 'notification',
      data: {
        ...notification,
        title: adminTitle,
        body: adminBody,
      },
      timestamp: new Date().toISOString(),
    });
    this.logger.debug(`Emitted customized notification to admin:orders for #${orderCode}`);
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

  /** Emit notification tới tất cả client đang nghe admin:alerts. */
  emitToAdminAlerts(notification: any) {
    this.server.emit('admin:alerts', {
      id: notification.id,
      title: notification.title,
      body: notification.body,
      data: notification.data,
      timestamp: notification.createdAt || new Date().toISOString(),
    });
    this.logger.debug(`Emitted notification to admin:alerts: ${notification.title}`);
  }

  private async checkAndEmitPendingRepayment(
    client: Socket,
    params: { userId?: string; orderCode?: string },
  ) {
    const paymentServiceUrl = this.configService.get<string>('PAYMENT_SERVICE_URL') || 'http://localhost:8085';
    const internalSecret = this.configService.get<string>('INTERNAL_SECRET') || 'internal-beverage-secret-2024';

    try {
      const url = new URL(`${paymentServiceUrl}/api/v1/internal/payments/pending-repayment`);
      if (params.userId) url.searchParams.append('userId', params.userId);
      if (params.orderCode) url.searchParams.append('orderCode', params.orderCode);

      this.logger.debug(`Checking pending repayment at: ${url.toString()}`);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'X-Internal-Secret': internalSecret,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        this.logger.warn(`Failed to fetch pending repayment from payment-service. Status: ${response.status}`);
        return;
      }

      const resBody = await response.json();
      if (resBody?.success && resBody?.data) {
        const paymentData = resBody.data;
        this.logger.log(
          `Found pending repayment for orderCode=${paymentData.orderCode}. Emitting alert to socket ${client.id}`,
        );
        client.emit('pending-payment-alert', {
          orderId: paymentData.orderId,
          orderCode: paymentData.orderCode,
          amount: paymentData.amount,
          totalPendingCount: paymentData.totalPendingCount,
        });
      } else {
        this.logger.log(`No pending repayment found for client ${client.id}. Emitting null.`);
        client.emit('pending-payment-alert', null);
      }
    } catch (error) {
      this.logger.error(`Error checking pending repayment: ${error.message}`);
    }
  }
}
