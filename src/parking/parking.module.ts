import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Floor } from 'src/common/entities/floor.entity';
import { Spot } from 'src/common/entities/spot.entity';
import { Vehicle } from './entities/vehicle.entity';
import { Gate } from './entities/gate.entity';
import { Ticket } from './entities/ticket.entity';
import { Payment } from './entities/payment.entity';
import { FirstAvailableStrategy } from './strategies/first-available.strategy';
import { AllocationService } from './services/allocation.service';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Floor,
      Spot,
      Floor,
      Vehicle,
      Gate,
      Ticket,
      Payment,
    ]), // registers repositories
  ],
  controllers: [],
  providers: [FirstAvailableStrategy, AllocationService],
  exports: [FirstAvailableStrategy, AllocationService],
})
export class ParkingModule {}
