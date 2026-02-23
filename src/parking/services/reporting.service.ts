import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Spot, SpotStatus } from 'src/common/entities/spot.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Payment, PaymentStatus } from '../entities/payment.entity';
import { Ticket, TicketStatus } from '../entities/ticket.entity';
import { ReportQueryDto } from '../dto/report-query.dto';
import { AuditLog } from '../entities/audit-log.entity';
import { AuditLogQueryDto } from '../dto/audit-log-query.dto';

@Injectable()
export class ReportingService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Spot)
    private readonly spotRepo: Repository<Spot>,
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async revenueSummary(query: ReportQueryDto) {
    const { from, to } = this.resolveDateRange(query.from, query.to);
    const granularity = query.granularity ?? 'day';

    const [total, trends] = await Promise.all([
      this.paymentRepo
        .createQueryBuilder('payment')
        .select('COALESCE(SUM(payment.amount), 0)', 'revenue')
        .addSelect('COUNT(payment.id)', 'payments')
        .where('payment.status = :status', { status: PaymentStatus.SUCCEEDED })
        .andWhere('payment.paidAt BETWEEN :from AND :to', { from, to })
        .getRawOne<{ revenue: string; payments: string }>(),
      this.paymentRepo
        .createQueryBuilder('payment')
        .select(`DATE_TRUNC('${granularity}', payment.paidAt)`, 'bucket')
        .addSelect('SUM(payment.amount)', 'revenue')
        .addSelect('COUNT(payment.id)', 'payments')
        .where('payment.status = :status', { status: PaymentStatus.SUCCEEDED })
        .andWhere('payment.paidAt BETWEEN :from AND :to', { from, to })
        .groupBy('bucket')
        .orderBy('bucket', 'ASC')
        .getRawMany<{ bucket: string; revenue: string; payments: string }>(),
    ]);

    const totalSummary = total ?? { revenue: '0', payments: '0' };

    return {
      from,
      to,
      totalRevenue: Number(totalSummary.revenue ?? 0),
      totalPayments: Number(totalSummary.payments ?? 0),
      trend: trends.map((t) => ({
        bucket: t.bucket,
        revenue: Number(t.revenue),
        payments: Number(t.payments),
      })),
    };
  }

  async occupancyRate() {
    const [totalSpots, occupiedSpots, floors] = await Promise.all([
      this.spotRepo.count(),
      this.spotRepo.count({
        where: [{ status: SpotStatus.OCCUPIED }, { isOccupied: true }],
      }),
      this.spotRepo
        .createQueryBuilder('spot')
        .leftJoin('spot.floor', 'floor')
        .select('floor.id', 'floorId')
        .addSelect('floor.number', 'floorNumber')
        .addSelect('COUNT(spot.id)', 'total')
        .addSelect(
          `SUM(CASE WHEN spot.status = :occupied OR spot."isOccupied" = true THEN 1 ELSE 0 END)`,
          'occupied',
        )
        .setParameter('occupied', SpotStatus.OCCUPIED)
        .groupBy('floor.id')
        .addGroupBy('floor.number')
        .orderBy('floor.number', 'ASC')
        .getRawMany<{
          floorId: string;
          floorNumber: string;
          total: string;
          occupied: string;
        }>(),
    ]);

    return {
      totalSpots,
      occupiedSpots,
      occupancyRate: totalSpots
        ? Number(((occupiedSpots / totalSpots) * 100).toFixed(2))
        : 0,
      floorBreakdown: floors.map((row) => ({
        floorId: Number(row.floorId),
        floorNumber: Number(row.floorNumber),
        totalSpots: Number(row.total),
        occupiedSpots: Number(row.occupied),
        occupancyRate: Number(
          (
            (Number(row.occupied) / Math.max(Number(row.total), 1)) *
            100
          ).toFixed(2),
        ),
      })),
    };
  }

  async activeTickets(pagination: PaginationDto) {
    const skip = (pagination.page - 1) * pagination.limit;
    const [rows, total] = await this.ticketRepo.findAndCount({
      where: { status: TicketStatus.ACTIVE },
      relations: ['vehicle', 'spot', 'spot.floor', 'entryGate'],
      order: { entryTime: 'DESC' },
      skip,
      take: pagination.limit,
    });

    return {
      page: pagination.page,
      limit: pagination.limit,
      total,
      data: rows,
    };
  }

  async historicalTicketAnalytics(query: ReportQueryDto) {
    const { from, to } = this.resolveDateRange(query.from, query.to);
    const granularity = query.granularity ?? 'day';

    const rows = await this.ticketRepo
      .createQueryBuilder('ticket')
      .select(`DATE_TRUNC('${granularity}', ticket."entryTime")`, 'bucket')
      .addSelect('COUNT(ticket.id)', 'entries')
      .addSelect(
        `SUM(CASE WHEN ticket.status = :completed THEN 1 ELSE 0 END)`,
        'completed',
      )
      .addSelect('AVG(ticket."durationMinutes")', 'avgDurationMinutes')
      .setParameter('completed', TicketStatus.COMPLETED)
      .where('ticket."entryTime" BETWEEN :from AND :to', { from, to })
      .groupBy('bucket')
      .orderBy('bucket', 'ASC')
      .getRawMany<{
        bucket: string;
        entries: string;
        completed: string;
        avgDurationMinutes: string | null;
      }>();

    return rows.map((row) => ({
      bucket: row.bucket,
      entries: Number(row.entries),
      completed: Number(row.completed),
      avgDurationMinutes: row.avgDurationMinutes
        ? Number(Number(row.avgDurationMinutes).toFixed(2))
        : 0,
    }));
  }

  async peakHourAnalysis(query: ReportQueryDto) {
    const { from, to } = this.resolveDateRange(query.from, query.to);

    const rows = await this.ticketRepo
      .createQueryBuilder('ticket')
      .select(`EXTRACT(HOUR FROM ticket."entryTime")`, 'hour')
      .addSelect('COUNT(ticket.id)', 'entries')
      .where('ticket."entryTime" BETWEEN :from AND :to', { from, to })
      .groupBy('hour')
      .orderBy('entries', 'DESC')
      .addOrderBy('hour', 'ASC')
      .getRawMany<{ hour: string; entries: string }>();

    return rows.map((row) => ({
      hour: Number(row.hour),
      entries: Number(row.entries),
    }));
  }

  async dashboardMetrics() {
    const [activeTickets, occupancy] = await Promise.all([
      this.ticketRepo.count({ where: { status: TicketStatus.ACTIVE } }),
      this.occupancyRate(),
    ]);

    return {
      activeTickets,
      occupancyRate: occupancy.occupancyRate,
      updatedAt: new Date().toISOString(),
    };
  }

  async auditLogs(query: AuditLogQueryDto) {
    const skip = (query.page - 1) * query.limit;
    const [rows, total] = await this.auditRepo.findAndCount({
      where: {
        ...(query.entityType ? { entityType: query.entityType } : {}),
        ...(query.entityId ? { entityId: query.entityId } : {}),
      },
      order: {
        createdAt: 'DESC',
      },
      skip,
      take: query.limit,
    });

    return {
      page: query.page,
      limit: query.limit,
      total,
      data: rows,
    };
  }

  private resolveDateRange(
    from?: string,
    to?: string,
  ): { from: Date; to: Date } {
    const toDate = to ? new Date(to) : new Date();
    const fromDate = from
      ? new Date(from)
      : new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    return {
      from: fromDate,
      to: toDate,
    };
  }
}
