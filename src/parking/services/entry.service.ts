import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { Vehicle, VehicleType } from '../entities/vehicle.entity';
import { Gate, GateType } from '../entities/gate.entity';
import { Ticket, TicketStatus } from '../entities/ticket.entity';
import { CreateEntryDto } from '../dto/create-entry.dto';
import { AllocationService } from './allocation.service';
import { Spot, SpotStatus } from 'src/common/entities/spot.entity';
import { AuditEntityType } from '../entities/audit-log.entity';
import { AuditService } from './audit.service';
import { ParkingGateway } from '../gateways/parking.gateway';

@Injectable()
export class EntryService {
  constructor(
    private readonly dataSource: DataSource,
    private allocationService: AllocationService,
    private readonly auditService: AuditService,
    private readonly parkingGateway: ParkingGateway,
  ) {}

  async handleEntry(dto: CreateEntryDto, actorId?: number): Promise<Ticket> {
    const fullTicket = await this.dataSource.transaction(async (manager) => {
      const gate = await manager.findOne(Gate, {
        where: { id: dto.gateId },
      });
      if (!gate) {
        throw new NotFoundException('Gate not found');
      }
      if (gate.gateType !== GateType.ENTRY) {
        throw new BadRequestException('Selected gate is not an entry gate');
      }

      let vehicle = await manager.findOne(Vehicle, {
        where: { vehicleNumber: dto.vehicleNumber },
        lock: { mode: 'pessimistic_write' },
      });

      if (vehicle && vehicle.type !== dto.vehicleType) {
        throw new BadRequestException(
          'Vehicle type does not match existing record',
        );
      }

      if (!vehicle) {
        vehicle = manager.create(Vehicle, {
          vehicleNumber: dto.vehicleNumber,
          type: dto.vehicleType,
        });
        vehicle = await manager.save(vehicle);
      }

      const activeTicket = await manager.findOne(Ticket, {
        where: {
          vehicle: { id: vehicle.id },
          status: TicketStatus.ACTIVE,
        },
      });
      if (activeTicket) {
        throw new BadRequestException('Vehicle already has an active ticket');
      }

      const spot = await this.allocationService.allocateSpot(
        manager,
        dto.vehicleType,
      );
      if (!spot) {
        throw new BadRequestException(
          'No available spot for this vehicle type',
        );
      }

      const previousSpotState = {
        status: spot.status,
        isOccupied: spot.isOccupied,
      };

      spot.status = SpotStatus.OCCUPIED;
      spot.isOccupied = true;
      await manager.save(Spot, spot);

      const ticket = manager.create(Ticket, {
        ticketNumber: this.generateTicketNumber(dto.vehicleType),
        entryTime: new Date(),
        status: TicketStatus.ACTIVE,
        vehicle,
        spot,
        entryGate: gate,
      });

      const savedTicket = await manager.save(Ticket, ticket);
      await this.auditService.logMany(manager, [
        {
          entityType: AuditEntityType.SPOT,
          entityId: spot.id,
          eventType: 'spot.occupied',
          actorId,
          previousState: previousSpotState,
          nextState: {
            status: spot.status,
            isOccupied: spot.isOccupied,
            ticketNumber: savedTicket.ticketNumber,
          },
        },
        {
          entityType: AuditEntityType.TICKET,
          entityId: savedTicket.id,
          eventType: 'ticket.created',
          actorId,
          nextState: {
            ticketNumber: savedTicket.ticketNumber,
            status: savedTicket.status,
            vehicleNumber: vehicle.vehicleNumber,
          },
        },
      ]);

      const result = await manager.findOne(Ticket, {
        where: { id: savedTicket.id },
        relations: ['vehicle', 'spot', 'spot.floor', 'entryGate'],
      });
      if (!result) {
        throw new NotFoundException('Ticket not found after creation');
      }
      return result;
    });

    this.parkingGateway.broadcastSpotUpdate({
      spotId: fullTicket.spot.id,
      spotNumber: fullTicket.spot.spotNumber,
      floorNumber: fullTicket.spot.floor.number,
      status: SpotStatus.OCCUPIED,
      ticketNumber: fullTicket.ticketNumber,
    });
    this.parkingGateway.broadcastTicketLifecycle({
      ticketNumber: fullTicket.ticketNumber,
      status: 'active',
    });
    await this.broadcastDashboardMetrics();

    return fullTicket;
  }

  private generateTicketNumber(vehicleType: VehicleType): string {
    const prefix = vehicleType.substring(0, 1).toUpperCase();
    const epoch = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `TKT-${prefix}-${epoch}-${random}`;
  }

  private async broadcastDashboardMetrics(): Promise<void> {
    const [activeTickets, totalSpots, occupiedSpots] = await Promise.all([
      this.dataSource.getRepository(Ticket).count({
        where: { status: TicketStatus.ACTIVE },
      }),
      this.dataSource.getRepository(Spot).count(),
      this.dataSource
        .getRepository(Spot)
        .count({ where: { status: SpotStatus.OCCUPIED } }),
    ]);

    this.parkingGateway.broadcastDashboardMetrics({
      activeTickets,
      occupancyRate: totalSpots
        ? Number(((occupiedSpots / totalSpots) * 100).toFixed(2))
        : 0,
      updatedAt: new Date().toISOString(),
    });
  }
}
