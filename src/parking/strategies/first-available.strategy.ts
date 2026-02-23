import { Injectable } from '@nestjs/common';
import { AllocationStrategy } from './allocation-strategy.interface';
import { Spot, SpotStatus, SpotType } from 'src/common/entities/spot.entity';
import { VehicleType } from '../entities/vehicle.entity';
import { EntityManager } from 'typeorm';

@Injectable()
export class FirstAvailableStrategy implements AllocationStrategy {
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

  async findSpot(
    manager: EntityManager,
    vehicleType: VehicleType,
  ): Promise<Spot | null> {
    const allowedSpotTypes = this.mapVehicleToSpot(vehicleType);
    if (allowedSpotTypes.length === 0) {
      return null;
    }

    return manager
      .getRepository(Spot)
      .createQueryBuilder('spot')
      .innerJoinAndSelect('spot.floor', 'floor')
      .where('spot.status = :status', { status: SpotStatus.AVAILABLE })
      .andWhere('spot.type IN (:...allowedSpotTypes)', { allowedSpotTypes })
      .setLock('pessimistic_write')
      .setOnLocked('skip_locked')
      .orderBy('floor.number', 'ASC')
      .addOrderBy('spot.spotNumber', 'ASC')
      .getOne();
  }
}
