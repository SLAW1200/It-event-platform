// Socket.IO gateway for real-time check-in events. Clients connect to the
// `/checkin` namespace, then join a per-event room (`event:<id>`) so each
// organiser only receives broadcasts for their own event.
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

  // Clients call `socket.emit('join-event', eventId)` after connecting so the
  // server can scope subsequent broadcasts to their event.
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

  // Called by CheckInService after a successful scan. `to(room).emit` only
  // delivers to sockets that have joined the room — every other event's
  // dashboard ignores this broadcast.
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
