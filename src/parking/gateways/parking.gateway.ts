import { Injectable, Logger } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { SpotStatus } from 'src/common/entities/spot.entity';

@Injectable()
@WebSocketGateway({
  namespace: '/parking',
  cors: {
    origin: '*',
  },
})
export class ParkingGateway {
  private readonly logger = new Logger(ParkingGateway.name);

  @WebSocketServer()
  server: Server;

  broadcastSpotUpdate(input: {
    spotId: number;
    spotNumber: string;
    floorNumber: number;
    status: SpotStatus;
    ticketNumber?: string;
  }): void {
    this.server.emit('spot.updated', input);
  }

  broadcastDashboardMetrics(input: {
    activeTickets: number;
    occupancyRate: number;
    updatedAt: string;
  }): void {
    this.server.emit('dashboard.metrics', input);
  }

  broadcastTicketLifecycle(input: {
    ticketNumber: string;
    status: 'active' | 'completed';
  }): void {
    this.server.emit('ticket.lifecycle', input);
  }

  afterInit(): void {
    this.logger.log('Parking websocket gateway initialized');
  }
}
