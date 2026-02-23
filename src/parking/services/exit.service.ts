import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Spot, SpotStatus } from 'src/common/entities/spot.entity';
import { CreateExitDto } from '../dto/create-exit.dto';
import { Gate, GateType } from '../entities/gate.entity';
import { Payment, PaymentStatus } from '../entities/payment.entity';
import { Ticket, TicketStatus } from '../entities/ticket.entity';
import { AuditEntityType } from '../entities/audit-log.entity';
import { PricingEngineService } from '../pricing/pricing-engine.service';
import { AuditService } from './audit.service';
import { ParkingGateway } from '../gateways/parking.gateway';

export interface ExitReceipt {
  ticket: Ticket;
  payment: Payment;
}

@Injectable()
export class ExitService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly pricingEngine: PricingEngineService,
    private readonly auditService: AuditService,
    private readonly parkingGateway: ParkingGateway,
  ) {}

  async handleExit(dto: CreateExitDto, actorId?: number): Promise<ExitReceipt> {
    const receipt = await this.dataSource.transaction(async (manager) => {
      const gate = await manager.findOne(Gate, {
        where: { id: dto.gateId },
      });

      if (!gate) {
        throw new NotFoundException('Gate not found');
      }
      if (gate.gateType !== GateType.EXIT) {
        throw new BadRequestException('Selected gate is not an exit gate');
      }

      const ticket = await manager
        .getRepository(Ticket)
        .createQueryBuilder('ticket')
        .leftJoinAndSelect('ticket.vehicle', 'vehicle')
        .leftJoinAndSelect('ticket.spot', 'spot')
        .leftJoinAndSelect('spot.floor', 'floor')
        .leftJoinAndSelect('ticket.entryGate', 'entryGate')
        .where('ticket.ticketNumber = :ticketNumber', {
          ticketNumber: dto.ticketNumber,
        })
        .setLock('pessimistic_write')
        .getOne();

      if (!ticket) {
        throw new NotFoundException('Ticket not found');
      }
      if (ticket.status !== TicketStatus.ACTIVE) {
        throw new BadRequestException('Ticket is not active');
      }

      const lockedSpot = await manager
        .getRepository(Spot)
        .createQueryBuilder('spot')
        .innerJoinAndSelect('spot.floor', 'floor')
        .where('spot.id = :spotId', { spotId: ticket.spot.id })
        .setLock('pessimistic_write')
        .getOne();

      if (!lockedSpot) {
        throw new NotFoundException('Allocated spot not found');
      }

      const pricing = this.pricingEngine.calculate({
        entryTime: ticket.entryTime,
        exitTime: new Date(),
        vehicleType: ticket.vehicle.type,
      });

      const previousSpotState = {
        status: lockedSpot.status,
        isOccupied: lockedSpot.isOccupied,
      };
      const previousTicketState = {
        status: ticket.status,
        exitTime: ticket.exitTime,
      };

      ticket.exitTime = new Date();
      ticket.status = TicketStatus.COMPLETED;
      ticket.exitGate = gate;
      ticket.durationMinutes = pricing.durationMinutes;
      ticket.calculatedAmount = pricing.totalAmount;
      const savedTicket = await manager.save(Ticket, ticket);

      const payment = manager.create(Payment, {
        amount: pricing.totalAmount,
        paidAt: new Date(),
        method: dto.paymentMethod,
        status: PaymentStatus.SUCCEEDED,
        ticket: savedTicket,
        breakdown: {
          durationMinutes: pricing.durationMinutes,
          billableHours: pricing.billableHours,
          baseRate: pricing.baseRate,
          graceApplied: pricing.graceApplied,
          multipliers: pricing.multipliers,
        },
      });
      const savedPayment = await manager.save(Payment, payment);

      savedTicket.payment = savedPayment;
      await manager.save(Ticket, savedTicket);

      lockedSpot.isOccupied = false;
      lockedSpot.status = SpotStatus.AVAILABLE;
      await manager.save(Spot, lockedSpot);

      await this.auditService.logMany(manager, [
        {
          entityType: AuditEntityType.TICKET,
          entityId: savedTicket.id,
          eventType: 'ticket.completed',
          actorId,
          previousState: previousTicketState,
          nextState: {
            status: savedTicket.status,
            exitTime: savedTicket.exitTime?.toISOString(),
            calculatedAmount: savedTicket.calculatedAmount,
          },
        },
        {
          entityType: AuditEntityType.PAYMENT,
          entityId: savedPayment.id,
          eventType: 'payment.succeeded',
          actorId,
          nextState: {
            amount: savedPayment.amount,
            method: savedPayment.method,
            status: savedPayment.status,
          },
        },
        {
          entityType: AuditEntityType.SPOT,
          entityId: lockedSpot.id,
          eventType: 'spot.released',
          actorId,
          previousState: previousSpotState,
          nextState: {
            status: lockedSpot.status,
            isOccupied: lockedSpot.isOccupied,
          },
          metadata: {
            ticketNumber: savedTicket.ticketNumber,
          },
        },
      ]);

      return {
        ticket: savedTicket,
        payment: savedPayment,
      };
    });

    this.parkingGateway.broadcastSpotUpdate({
      spotId: receipt.ticket.spot.id,
      spotNumber: receipt.ticket.spot.spotNumber,
      floorNumber: receipt.ticket.spot.floor.number,
      status: SpotStatus.AVAILABLE,
    });
    this.parkingGateway.broadcastTicketLifecycle({
      ticketNumber: receipt.ticket.ticketNumber,
      status: 'completed',
    });
    await this.broadcastDashboardMetrics();

    return receipt;
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
