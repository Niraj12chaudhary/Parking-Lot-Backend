import { Injectable } from '@nestjs/common';
import { FirstAvailableStrategy } from '../strategies/first-available.strategy';
import { VehicleType } from '../entities/vehicle.entity';
import { Spot } from 'src/common/entities/spot.entity';
import { EntityManager } from 'typeorm';

@Injectable()
export class AllocationService {
  constructor(private firstAvailableStrategy: FirstAvailableStrategy) {}

  async allocateSpot(
    manager: EntityManager,
    vehicleType: VehicleType,
  ): Promise<Spot | null> {
    return this.firstAvailableStrategy.findSpot(manager, vehicleType);
  }
}
