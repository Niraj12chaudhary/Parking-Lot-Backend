import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Floor } from 'src/common/entities/floor.entity';
import { Spot } from 'src/common/entities/spot.entity';
import { AuthModule } from 'src/auth/auth.module';
import { Vehicle } from './entities/vehicle.entity';
import { Gate } from './entities/gate.entity';
import { Ticket } from './entities/ticket.entity';
import { Payment } from './entities/payment.entity';
import { AuditLog } from './entities/audit-log.entity';
import { FirstAvailableStrategy } from './strategies/first-available.strategy';
import { AllocationService } from './services/allocation.service';
import { EntryService } from './services/entry.service';
import { EntryController } from './controllers/entry.controller';
import { ExitController } from './controllers/exit.controller';
import { ReportsController } from './controllers/reports.controller';
import { ExitService } from './services/exit.service';
import { PricingEngineService } from './pricing/pricing-engine.service';
import { AuditService } from './services/audit.service';
import { ReportingService } from './services/reporting.service';
import { ParkingGateway } from './gateways/parking.gateway';
import { ParkingQueryController } from './controllers/parking-query.controller';
import { ParkingQueryService } from './services/parking-query.service';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      Floor,
      Spot,
      Vehicle,
      Gate,
      Ticket,
      Payment,
      AuditLog,
    ]), // registers repositories
  ],
  controllers: [
    EntryController,
    ExitController,
    ReportsController,
    ParkingQueryController,
  ],
  providers: [
    FirstAvailableStrategy,
    AllocationService,
    EntryService,
    ExitService,
    PricingEngineService,
    AuditService,
    ReportingService,
    ParkingGateway,
    ParkingQueryService,
    RolesGuard,
    JwtAuthGuard,
  ],
  exports: [
    FirstAvailableStrategy,
    AllocationService,
    EntryService,
    ExitService,
    ReportingService,
    ParkingGateway,
  ],
})
export class ParkingModule {}
