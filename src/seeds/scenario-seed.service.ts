import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { Spot, SpotStatus } from 'src/common/entities/spot.entity';
import { Gate, GateType } from 'src/parking/entities/gate.entity';
import {
  Payment,
  PaymentMethod,
  PaymentStatus,
} from 'src/parking/entities/payment.entity';
import { Ticket, TicketStatus } from 'src/parking/entities/ticket.entity';
import { Vehicle, VehicleType } from 'src/parking/entities/vehicle.entity';
import {
  AuditEntityType,
  AuditLog,
} from 'src/parking/entities/audit-log.entity';

type CompletedScenario = {
  vehicleType: VehicleType;
  entryTime: Date;
  exitTime: Date;
  durationMinutes: number;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  spot: Spot;
  entryGate: Gate;
  exitGate: Gate;
  ticketNumber: string;
  vehicleNumber: string;
};

@Injectable()
export class ScenarioSeedService {
  private readonly logger = new Logger(ScenarioSeedService.name);

  constructor(
    @InjectRepository(Spot)
    private readonly spotRepo: Repository<Spot>,
    @InjectRepository(Gate)
    private readonly gateRepo: Repository<Gate>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepo: Repository<Vehicle>,
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
    private readonly configService: ConfigService,
  ) {}

  async seedLargeScenarioData(manager?: EntityManager): Promise<void> {
    const spotRepo = manager ? manager.getRepository(Spot) : this.spotRepo;
    const gateRepo = manager ? manager.getRepository(Gate) : this.gateRepo;
    const vehicleRepo = manager
      ? manager.getRepository(Vehicle)
      : this.vehicleRepo;
    const ticketRepo = manager
      ? manager.getRepository(Ticket)
      : this.ticketRepo;
    const paymentRepo = manager
      ? manager.getRepository(Payment)
      : this.paymentRepo;
    const auditRepo = manager
      ? manager.getRepository(AuditLog)
      : this.auditLogRepo;

    const resetData = this.getBoolean('SEED_RESET_SCENARIO_DATA', false);
    const completedTicketsTarget = this.getNumber(
      'SEED_COMPLETED_TICKETS',
      5000,
    );
    const activeTicketsTarget = this.getNumber('SEED_ACTIVE_TICKETS', 45);
    const failedPaymentsTarget = this.getNumber('SEED_FAILED_PAYMENTS', 250);
    const pendingPaymentsTarget = this.getNumber('SEED_PENDING_PAYMENTS', 120);
    const reservedSpotsTarget = this.getNumber('SEED_RESERVED_SPOTS', 8);
    const outOfServiceSpotsTarget = this.getNumber(
      'SEED_OUT_OF_SERVICE_SPOTS',
      4,
    );
    const daysBack = this.getNumber('SEED_DAYS_BACK', 90);
    const batchSize = this.getNumber('SEED_BATCH_SIZE', 500);

    if (resetData) {
      await this.resetScenarioData(manager);
    }

    const [spots, entryGates, exitGates] = await Promise.all([
      spotRepo.find({
        relations: ['floor'],
        order: {
          floor: { number: 'ASC' },
          spotNumber: 'ASC',
        },
      }),
      gateRepo.find({ where: { gateType: GateType.ENTRY } }),
      gateRepo.find({ where: { gateType: GateType.EXIT } }),
    ]);

    if (!spots.length) {
      throw new Error('No spots available for scenario seeding');
    }
    if (!entryGates.length || !exitGates.length) {
      throw new Error(
        'Both entry and exit gates are required for scenario seeding',
      );
    }

    const nonOperationalPool = spots.filter(
      (spot) => spot.status === SpotStatus.AVAILABLE && !spot.isOccupied,
    );
    const reservedSpots = nonOperationalPool.slice(0, reservedSpotsTarget);
    const outOfServiceSpots = nonOperationalPool.slice(
      reservedSpotsTarget,
      reservedSpotsTarget + outOfServiceSpotsTarget,
    );

    if (reservedSpots.length) {
      await spotRepo.update(
        { id: In(reservedSpots.map((spot) => spot.id)) },
        { status: SpotStatus.RESERVED, isOccupied: false },
      );
    }
    if (outOfServiceSpots.length) {
      await spotRepo.update(
        { id: In(outOfServiceSpots.map((spot) => spot.id)) },
        { status: SpotStatus.OUT_OF_SERVICE, isOccupied: false },
      );
    }

    const operationalSpots = spots.filter(
      (spot) =>
        !reservedSpots.some((reserved) => reserved.id === spot.id) &&
        !outOfServiceSpots.some((disabled) => disabled.id === spot.id),
    );

    await this.seedCompletedScenarios({
      ticketRepo,
      paymentRepo,
      vehicleRepo,
      auditRepo,
      spots: operationalSpots,
      entryGates,
      exitGates,
      completedTicketsTarget,
      failedPaymentsTarget,
      pendingPaymentsTarget,
      daysBack,
      batchSize,
    });

    await this.seedActiveScenarios({
      ticketRepo,
      vehicleRepo,
      auditRepo,
      spotRepo,
      spots: operationalSpots,
      entryGates,
      activeTicketsTarget,
    });

    await this.logSpotStateChanges(auditRepo, reservedSpots, outOfServiceSpots);

    this.logger.log(
      `Large scenario seed completed with ${completedTicketsTarget} completed tickets and ${activeTicketsTarget} active tickets`,
    );
  }

  private async seedCompletedScenarios(input: {
    ticketRepo: Repository<Ticket>;
    paymentRepo: Repository<Payment>;
    vehicleRepo: Repository<Vehicle>;
    auditRepo: Repository<AuditLog>;
    spots: Spot[];
    entryGates: Gate[];
    exitGates: Gate[];
    completedTicketsTarget: number;
    failedPaymentsTarget: number;
    pendingPaymentsTarget: number;
    daysBack: number;
    batchSize: number;
  }): Promise<void> {
    const {
      ticketRepo,
      paymentRepo,
      vehicleRepo,
      auditRepo,
      spots,
      entryGates,
      exitGates,
      completedTicketsTarget,
      failedPaymentsTarget,
      pendingPaymentsTarget,
      daysBack,
      batchSize,
    } = input;

    let created = 0;
    let failedPayments = 0;
    let pendingPayments = 0;

    while (created < completedTicketsTarget) {
      const currentBatchSize = Math.min(
        batchSize,
        completedTicketsTarget - created,
      );
      const scenarios: CompletedScenario[] = [];

      for (let index = 0; index < currentBatchSize; index++) {
        const spot = spots[(created + index) % spots.length];
        const vehicleType = this.randomVehicleType();
        const { entryTime, exitTime, durationMinutes } =
          this.randomEntryExit(daysBack);

        let paymentStatus = PaymentStatus.SUCCEEDED;
        if (failedPayments < failedPaymentsTarget) {
          paymentStatus = PaymentStatus.FAILED;
          failedPayments++;
        } else if (pendingPayments < pendingPaymentsTarget) {
          paymentStatus = PaymentStatus.PENDING;
          pendingPayments++;
        }

        scenarios.push({
          vehicleType,
          entryTime,
          exitTime,
          durationMinutes,
          amount: this.calculateAmount(vehicleType, durationMinutes, exitTime),
          paymentMethod: this.randomPaymentMethod(),
          paymentStatus,
          spot,
          entryGate: entryGates[(created + index) % entryGates.length],
          exitGate: exitGates[(created + index) % exitGates.length],
          ticketNumber: this.generateTicketNumber(created + index + 1),
          vehicleNumber: this.generateVehicleNumber(created + index + 1),
        });
      }

      const vehicles = scenarios.map((scenario) =>
        vehicleRepo.create({
          vehicleNumber: scenario.vehicleNumber,
          type: scenario.vehicleType,
        }),
      );
      const savedVehicles = await vehicleRepo.save(vehicles, {
        chunk: currentBatchSize,
      });

      const tickets = scenarios.map((scenario, index) =>
        ticketRepo.create({
          ticketNumber: scenario.ticketNumber,
          entryTime: scenario.entryTime,
          exitTime: scenario.exitTime,
          status: TicketStatus.COMPLETED,
          durationMinutes: scenario.durationMinutes,
          calculatedAmount: scenario.amount,
          vehicle: savedVehicles[index],
          spot: scenario.spot,
          entryGate: scenario.entryGate,
          exitGate: scenario.exitGate,
        }),
      );
      const savedTickets = await ticketRepo.save(tickets, {
        chunk: currentBatchSize,
      });

      const payments = savedTickets.map((ticket, index) =>
        paymentRepo.create({
          amount: scenarios[index].amount,
          paidAt: scenarios[index].exitTime,
          method: scenarios[index].paymentMethod,
          status: scenarios[index].paymentStatus,
          breakdown: {
            seededScenario: true,
            durationMinutes: scenarios[index].durationMinutes,
          },
          ticket,
        }),
      );
      const savedPayments = await paymentRepo.save(payments, {
        chunk: currentBatchSize,
      });

      const audits: AuditLog[] = [];
      for (let index = 0; index < currentBatchSize; index++) {
        audits.push(
          auditRepo.create({
            entityType: AuditEntityType.TICKET,
            entityId: savedTickets[index].id,
            eventType: 'ticket.created',
            nextState: {
              ticketNumber: savedTickets[index].ticketNumber,
              status: TicketStatus.ACTIVE,
            },
            metadata: { seededScenario: true },
          }),
          auditRepo.create({
            entityType: AuditEntityType.PAYMENT,
            entityId: savedPayments[index].id,
            eventType: `payment.${savedPayments[index].status}`,
            nextState: {
              status: savedPayments[index].status,
              amount: savedPayments[index].amount,
            },
            metadata: { seededScenario: true },
          }),
          auditRepo.create({
            entityType: AuditEntityType.TICKET,
            entityId: savedTickets[index].id,
            eventType: 'ticket.completed',
            previousState: { status: TicketStatus.ACTIVE },
            nextState: {
              status: TicketStatus.COMPLETED,
              exitTime: savedTickets[index].exitTime,
            },
            metadata: { seededScenario: true },
          }),
        );
      }
      await auditRepo.save(audits, { chunk: currentBatchSize * 3 });
      created += currentBatchSize;
    }
  }

  private async seedActiveScenarios(input: {
    ticketRepo: Repository<Ticket>;
    vehicleRepo: Repository<Vehicle>;
    auditRepo: Repository<AuditLog>;
    spotRepo: Repository<Spot>;
    spots: Spot[];
    entryGates: Gate[];
    activeTicketsTarget: number;
  }): Promise<void> {
    const {
      ticketRepo,
      vehicleRepo,
      auditRepo,
      spotRepo,
      spots,
      entryGates,
      activeTicketsTarget,
    } = input;

    const availableSpots = spots.filter(
      (spot) => spot.status === SpotStatus.AVAILABLE && !spot.isOccupied,
    );
    const activeCount = Math.min(activeTicketsTarget, availableSpots.length);
    if (activeCount <= 0) {
      return;
    }

    const vehicles = Array.from({ length: activeCount }, (_, index) =>
      vehicleRepo.create({
        vehicleNumber: this.generateVehicleNumber(900000 + index),
        type: this.randomVehicleType(),
      }),
    );
    const savedVehicles = await vehicleRepo.save(vehicles, { chunk: 200 });

    const now = Date.now();
    const tickets = availableSpots.slice(0, activeCount).map((spot, index) =>
      ticketRepo.create({
        ticketNumber: this.generateTicketNumber(900000 + index),
        entryTime: new Date(now - (index + 1) * 13 * 60_000),
        status: TicketStatus.ACTIVE,
        vehicle: savedVehicles[index],
        spot,
        entryGate: entryGates[index % entryGates.length],
      }),
    );
    const savedTickets = await ticketRepo.save(tickets, { chunk: 200 });

    const occupiedIds = availableSpots
      .slice(0, activeCount)
      .map((spot) => spot.id);
    await spotRepo.update(
      { id: In(occupiedIds) },
      {
        status: SpotStatus.OCCUPIED,
        isOccupied: true,
      },
    );

    const audits: AuditLog[] = [];
    for (let index = 0; index < activeCount; index++) {
      audits.push(
        auditRepo.create({
          entityType: AuditEntityType.TICKET,
          entityId: savedTickets[index].id,
          eventType: 'ticket.created',
          nextState: {
            ticketNumber: savedTickets[index].ticketNumber,
            status: TicketStatus.ACTIVE,
          },
          metadata: { seededScenario: true },
        }),
        auditRepo.create({
          entityType: AuditEntityType.SPOT,
          entityId: availableSpots[index].id,
          eventType: 'spot.occupied',
          previousState: { status: SpotStatus.AVAILABLE, isOccupied: false },
          nextState: { status: SpotStatus.OCCUPIED, isOccupied: true },
          metadata: {
            seededScenario: true,
            ticketNumber: savedTickets[index].ticketNumber,
          },
        }),
      );
    }
    await auditRepo.save(audits, { chunk: 400 });
  }

  private async logSpotStateChanges(
    auditRepo: Repository<AuditLog>,
    reservedSpots: Spot[],
    outOfServiceSpots: Spot[],
  ): Promise<void> {
    const logs: AuditLog[] = [];

    for (const spot of reservedSpots) {
      logs.push(
        auditRepo.create({
          entityType: AuditEntityType.SPOT,
          entityId: spot.id,
          eventType: 'spot.reserved',
          previousState: { status: spot.status, isOccupied: spot.isOccupied },
          nextState: { status: SpotStatus.RESERVED, isOccupied: false },
          metadata: { seededScenario: true },
        }),
      );
    }

    for (const spot of outOfServiceSpots) {
      logs.push(
        auditRepo.create({
          entityType: AuditEntityType.SPOT,
          entityId: spot.id,
          eventType: 'spot.out_of_service',
          previousState: { status: spot.status, isOccupied: spot.isOccupied },
          nextState: { status: SpotStatus.OUT_OF_SERVICE, isOccupied: false },
          metadata: { seededScenario: true },
        }),
      );
    }

    if (logs.length) {
      await auditRepo.save(logs);
    }
  }

  private async resetScenarioData(manager?: EntityManager): Promise<void> {
    if (manager) {
      await manager.query(
        'TRUNCATE TABLE "audit_log", "payment", "ticket", "vehicle" RESTART IDENTITY CASCADE',
      );
      await manager
        .getRepository(Spot)
        .createQueryBuilder()
        .update(Spot)
        .set({ status: SpotStatus.AVAILABLE, isOccupied: false })
        .execute();
      return;
    }

    await this.auditLogRepo.query(
      'TRUNCATE TABLE "audit_log", "payment", "ticket", "vehicle" RESTART IDENTITY CASCADE',
    );
    await this.spotRepo
      .createQueryBuilder()
      .update(Spot)
      .set({ status: SpotStatus.AVAILABLE, isOccupied: false })
      .execute();
  }

  private getNumber(key: string, defaultValue: number): number {
    const raw = this.configService.get<string | number>(key);
    if (typeof raw === 'number') {
      return raw;
    }
    if (typeof raw === 'string') {
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
    return defaultValue;
  }

  private getBoolean(key: string, defaultValue: boolean): boolean {
    const value = this.configService.get<string>(key);
    if (!value) {
      return defaultValue;
    }
    return value.toLowerCase() === 'true';
  }

  private randomVehicleType(): VehicleType {
    const roll = Math.random();
    if (roll < 0.58) return VehicleType.CAR;
    if (roll < 0.86) return VehicleType.BIKE;
    return VehicleType.TRUCK;
  }

  private randomPaymentMethod(): PaymentMethod {
    const roll = Math.random();
    if (roll < 0.48) return PaymentMethod.UPI;
    if (roll < 0.84) return PaymentMethod.CARD;
    return PaymentMethod.CASH;
  }

  private randomEntryExit(daysBack: number): {
    entryTime: Date;
    exitTime: Date;
    durationMinutes: number;
  } {
    const now = Date.now();
    const start = now - daysBack * 24 * 60 * 60_000;
    const entryMs = this.randomInt(start, now - 25 * 60_000);
    const scenarioRoll = Math.random();

    let durationMinutes = 0;
    if (scenarioRoll < 0.2) {
      durationMinutes = this.randomInt(1, 14); // grace-period scenario
    } else if (scenarioRoll < 0.58) {
      durationMinutes = this.randomInt(30, 240); // regular parking
    } else if (scenarioRoll < 0.86) {
      durationMinutes = this.randomInt(241, 720); // long duration
    } else {
      durationMinutes = this.randomInt(721, 1200); // overnight/multi-shift
    }

    const entryTime = new Date(entryMs);
    const exitTime = new Date(entryMs + durationMinutes * 60_000);
    return { entryTime, exitTime, durationMinutes };
  }

  private calculateAmount(
    vehicleType: VehicleType,
    durationMinutes: number,
    exitTime: Date,
  ): number {
    const graceMinutes = this.getNumber('PARKING_GRACE_PERIOD_MINUTES', 15);
    if (durationMinutes <= graceMinutes) {
      return 0;
    }

    const billableHours = Math.ceil(durationMinutes / 60);
    const rateMap: Record<VehicleType, number> = {
      [VehicleType.CAR]: this.getNumber('PARKING_RATE_CAR', 40),
      [VehicleType.BIKE]: this.getNumber('PARKING_RATE_BIKE', 20),
      [VehicleType.TRUCK]: this.getNumber('PARKING_RATE_TRUCK', 80),
    };

    let amount = billableHours * rateMap[vehicleType];
    const exitHour = exitTime.getHours();

    const surgeEnabled = this.getBoolean('PARKING_SURGE_ENABLED', true);
    const surgeStart = this.getNumber('PARKING_SURGE_START_HOUR', 17);
    const surgeEnd = this.getNumber('PARKING_SURGE_END_HOUR', 21);
    const surgeMultiplier = this.configService.get<number>(
      'PARKING_SURGE_MULTIPLIER',
      1.2,
    );
    if (surgeEnabled && this.isHourInRange(exitHour, surgeStart, surgeEnd)) {
      amount *= surgeMultiplier;
    }

    const nightEnabled = this.getBoolean('PARKING_NIGHT_ENABLED', true);
    const nightStart = this.getNumber('PARKING_NIGHT_START_HOUR', 22);
    const nightEnd = this.getNumber('PARKING_NIGHT_END_HOUR', 6);
    const nightMultiplier = this.configService.get<number>(
      'PARKING_NIGHT_MULTIPLIER',
      1.1,
    );
    if (nightEnabled && this.isHourInRange(exitHour, nightStart, nightEnd)) {
      amount *= nightMultiplier;
    }

    return Number(amount.toFixed(2));
  }

  private isHourInRange(hour: number, start: number, end: number): boolean {
    if (start <= end) {
      return hour >= start && hour < end;
    }
    return hour >= start || hour < end;
  }

  private generateVehicleNumber(sequence: number): string {
    const stateCode = ['MH', 'DL', 'KA', 'TN', 'GJ'][sequence % 5];
    const district = (10 + (sequence % 89)).toString().padStart(2, '0');
    const letters = String.fromCharCode(65 + (sequence % 26)).concat(
      String.fromCharCode(65 + ((sequence * 7) % 26)),
    );
    const digits = (1000 + (sequence % 9000)).toString();
    return `${stateCode}${district}${letters}${digits}`;
  }

  private generateTicketNumber(sequence: number): string {
    return `TKT-SEED-${sequence.toString().padStart(7, '0')}`;
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
