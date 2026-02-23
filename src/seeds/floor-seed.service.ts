import { Injectable } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { Floor } from 'src/common/entities/floor.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class FloorSeedService {
  constructor(
    @InjectRepository(Floor)
    private floorRepo: Repository<Floor>,
  ) {}

  async createFloors(manager?: EntityManager) {
    const floorRepo = manager ? manager.getRepository(Floor) : this.floorRepo;

    const floors = [
      { number: 1, name: 'Ground Floor' },
      { number: 2, name: 'First Floor' },
      { number: 3, name: 'Second Floor' },
    ];

    for (const f of floors) {
      const exists = await floorRepo.findOne({
        where: { number: f.number },
      });

      if (!exists) {
        await floorRepo.save(floorRepo.create(f));
      }
    }
  }
}
