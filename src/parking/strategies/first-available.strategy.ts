import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AllocationStrategy } from './allocation-strategy.interface';
import { Spot, SpotType } from 'src/common/entities/spot.entity';
import { VehicleType } from '../entities/vehicle.entity';

@Injectable()
export class FirstAvailableStrategy implements AllocationStrategy {
  constructor(
    @InjectRepository(Spot)
    private spotRepo: Repository<Spot>,
  ) {}

  private mapVehicleToSpot(vehicleType: VehicleType): SpotType[] {
    switch (vehicleType) {
      case VehicleType.CAR:
        return [SpotType.COMPACT, SpotType.LARGE];
      case VehicleType.BIKE:
        return [SpotType.BIKE];
      case VehicleType.TRUCK:
        return [SpotType.LARGE];
      default:
        return [];
    }
  }

  async findSpot(vehicleType: VehicleType): Promise<Spot | null> {
    const allowedSpotTypes = this.mapVehicleToSpot(vehicleType);

    return this.spotRepo.findOne({
      where: {
        isOccupied: false,
        type: allowedSpotTypes.length === 1 ? allowedSpotTypes[0] : undefined,
      },
      relations: ['floor'],
      order: {
        floor: { number: 'ASC' },
        spotNumber: 'ASC',
      },
    });
  }
}
