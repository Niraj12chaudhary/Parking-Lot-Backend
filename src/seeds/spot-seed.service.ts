import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Floor } from 'src/common/entities/floor.entity';
import { Spot, SpotType } from 'src/common/entities/spot.entity';

@Injectable()
export class SpotSeedService {
  constructor(
    @InjectRepository(Spot)
    private spotRepo: Repository<Spot>,

    @InjectRepository(Floor)
    private floorRepo: Repository<Floor>,
  ) {}

  async createSpots() {
    const floors = await this.floorRepo.find();

    for (const floor of floors) {
      const existing = await this.spotRepo.count({
        where: { floor: { id: floor.id } },
      });

      // Skip if already seeded
      if (existing > 0) continue;

      // Correct type so TS doesn't infer `never[]`
      const spots: Spot[] = [];

      // 10 compact
      for (let i = 1; i <= 10; i++) {
        spots.push(
          this.spotRepo.create({
            spotNumber: `C-${i}`,
            type: SpotType.COMPACT,
            floor,
          }),
        );
      }

      // 5 large
      for (let i = 1; i <= 5; i++) {
        spots.push(
          this.spotRepo.create({
            spotNumber: `L-${i}`,
            type: SpotType.LARGE,
            floor,
          }),
        );
      }

      // 10 bike
      for (let i = 1; i <= 10; i++) {
        spots.push(
          this.spotRepo.create({
            spotNumber: `B-${i}`,
            type: SpotType.BIKE,
            floor,
          }),
        );
      }

      await this.spotRepo.save(spots);
      console.log(`Spots created for Floor ${floor.number}`);
    }
  }
}
