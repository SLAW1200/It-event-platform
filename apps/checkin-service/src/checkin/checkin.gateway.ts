import {
  WebSocketGateway, WebSocketServer,
  SubscribeMessage, MessageBody, ConnectedSocket,
  OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/checkin' })
export class CheckInGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(CheckInGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-event')
  handleJoinEvent(
    @MessageBody() eventId: number,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`event:${eventId}`);
    this.logger.log(`Client ${client.id} joined event room ${eventId}`);
    return { joined: true, eventId };
  }

  @SubscribeMessage('leave-event')
  handleLeaveEvent(
    @MessageBody() eventId: number,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`event:${eventId}`);
    return { left: true, eventId };
  }

  emitCheckIn(eventId: number, data: Record<string, any>) {
    this.server.to(`event:${eventId}`).emit('check-in', {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  emitAttendanceUpdate(eventId: number, stats: Record<string, any>) {
    this.server.to(`event:${eventId}`).emit('attendance-update', stats);
  }
}
