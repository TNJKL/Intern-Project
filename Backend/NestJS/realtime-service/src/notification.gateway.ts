import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  path: '/ws',
  namespace: '/notifications',
  cors: {
    origin: '*',
  },
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`[Socket.IO] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[Socket.IO] Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join')
  handleJoin(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    console.log(`[Socket.IO] Client ${client.id} joined general room`);
    client.join('general');
    client.emit('joined', { room: 'general', success: true });
  }

  @SubscribeMessage('join-guest')
  handleJoinGuest(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { guestSessionId: string },
  ) {
    const guestSessionId = data?.guestSessionId;
    if (guestSessionId) {
      const room = `guest_${guestSessionId}`;
      console.log(`[Socket.IO] Guest client ${client.id} joined room: ${room}`);
      client.join(room);
      client.emit('joined-guest', { room, success: true });
    }
  }

  @SubscribeMessage('leave')
  handleLeave(@ConnectedSocket() client: Socket) {
    console.log(`[Socket.IO] Client ${client.id} left rooms`);
    const rooms = Array.from(client.rooms);
    rooms.forEach((room) => {
      if (room !== client.id) {
        client.leave(room);
      }
    });
  }
}
