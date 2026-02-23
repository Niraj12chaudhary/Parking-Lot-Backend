import { VehicleType } from '../entities/vehicle.entity';
import { Spot } from 'src/common/entities/spot.entity';
import { EntityManager } from 'typeorm';

export interface AllocationStrategy {
  findSpot(
    manager: EntityManager,
    vehicleType: VehicleType,
  ): Promise<Spot | null>;
}
