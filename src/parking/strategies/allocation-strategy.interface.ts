import { VehicleType } from '../entities/vehicle.entity';
import { Spot } from 'src/common/entities/spot.entity';

export interface AllocationStrategy {
  findSpot(vehicleType: VehicleType): Promise<Spot | null>;
}
