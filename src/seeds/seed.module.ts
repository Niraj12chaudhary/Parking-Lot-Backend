import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Spot } from 'src/common/entities/spot.entity';
import { Floor } from 'src/common/entities/floor.entity';
import { FloorSeedService } from './floor-seed.service';
import { SpotSeedService } from './spot-seed.service';
import { Gate } from 'src/parking/entities/gate.entity';
import { User } from 'src/auth/entities/user.entity';
import { GateSeedService } from './gate-seed.service';
import { UserSeedService } from './user-seed.service';
import { Vehicle } from 'src/parking/entities/vehicle.entity';
import { Ticket } from 'src/parking/entities/ticket.entity';
import { Payment } from 'src/parking/entities/payment.entity';
import { AuditLog } from 'src/parking/entities/audit-log.entity';
import { ScenarioSeedService } from './scenario-seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Floor,
      Spot,
      Gate,
      User,
      Vehicle,
      Ticket,
      Payment,
      AuditLog,
    ]),
  ],
  providers: [
    FloorSeedService,
    SpotSeedService,
    GateSeedService,
    UserSeedService,
    ScenarioSeedService,
  ],
  exports: [
    FloorSeedService,
    SpotSeedService,
    GateSeedService,
    UserSeedService,
    ScenarioSeedService,
  ],
})
export class SeedModule {}
