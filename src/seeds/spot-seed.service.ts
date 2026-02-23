import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import { Floor } from 'src/common/entities/floor.entity';
import { Spot, SpotStatus, SpotType } from 'src/common/entities/spot.entity';

@Injectable()
export class SpotSeedService {
  constructor(
    @InjectRepository(Spot)
    private spotRepo: Repository<Spot>,

    @InjectRepository(Floor)
    private floorRepo: Repository<Floor>,
  ) {}

  async createSpots(manager?: EntityManager) {
    const spotRepo = manager ? manager.getRepository(Spot) : this.spotRepo;
    const floorRepo = manager ? manager.getRepository(Floor) : this.floorRepo;

    const floors = await floorRepo.find();

    for (const floor of floors) {
      const existing = await spotRepo.count({
        where: { floor: { id: floor.id } },
      });

      // Skip if already seeded
      if (existing > 0) continue;

      // Correct type so TS doesn't infer `never[]`
      const spots: Spot[] = [];

      // 10 compact
      for (let i = 1; i <= 10; i++) {
        spots.push(
          spotRepo.create({
            spotNumber: `C-${i}`,
            type: SpotType.COMPACT,
            status: SpotStatus.AVAILABLE,
            floor,
          }),
        );
      }

      // 5 large
      for (let i = 1; i <= 5; i++) {
        spots.push(
          spotRepo.create({
            spotNumber: `L-${i}`,
            type: SpotType.LARGE,
            status: SpotStatus.AVAILABLE,
            floor,
          }),
        );
      }

      // 10 bike
      for (let i = 1; i <= 10; i++) {
        spots.push(
          spotRepo.create({
            spotNumber: `B-${i}`,
            type: SpotType.BIKE,
            status: SpotStatus.AVAILABLE,
            floor,
          }),
        );
      }

      await spotRepo.save(spots);
    }
  }
}
