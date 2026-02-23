import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserRole } from 'src/auth/entities/user.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { AuditLogQueryDto } from '../dto/audit-log-query.dto';
import { ReportQueryDto } from '../dto/report-query.dto';
import { ReportingService } from '../services/reporting.service';

@ApiTags('Parking - Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('parking/reports')
export class ReportsController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get('revenue-summary')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  revenueSummary(@Query() query: ReportQueryDto) {
    return this.reportingService.revenueSummary(query);
  }

  @Get('occupancy-rate')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.GATE_OPERATOR)
  occupancyRate() {
    return this.reportingService.occupancyRate();
  }

  @Get('active-tickets')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.GATE_OPERATOR)
  activeTickets(@Query() query: PaginationDto) {
    return this.reportingService.activeTickets(query);
  }

  @Get('historical-analytics')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  historicalAnalytics(@Query() query: ReportQueryDto) {
    return this.reportingService.historicalTicketAnalytics(query);
  }

  @Get('peak-hours')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  peakHours(@Query() query: ReportQueryDto) {
    return this.reportingService.peakHourAnalysis(query);
  }

  @Get('dashboard-metrics')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.GATE_OPERATOR)
  dashboardMetrics() {
    return this.reportingService.dashboardMetrics();
  }

  @Get('audit-logs')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  auditLogs(@Query() query: AuditLogQueryDto) {
    return this.reportingService.auditLogs(query);
  }
}
