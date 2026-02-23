import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Spot } from 'src/common/entities/spot.entity';
import { Floor } from 'src/common/entities/floor.entity';
import { SpotQueryDto } from '../dto/spot-query.dto';

@Injectable()
export class ParkingQueryService {
  constructor(
    @InjectRepository(Spot)
    private readonly spotRepo: Repository<Spot>,
    @InjectRepository(Floor)
    private readonly floorRepo: Repository<Floor>,
  ) {}

  async listSpots(query: SpotQueryDto) {
    return this.spotRepo.find({
      where: {
        ...(query.floorId ? { floor: { id: query.floorId } } : {}),
        ...(query.status ? { status: query.status } : {}),
      },
      relations: ['floor'],
      order: {
        floor: { number: 'ASC' },
        spotNumber: 'ASC',
      },
    });
  }

  async listFloors() {
    return this.floorRepo.find({
      relations: ['spots'],
      order: {
        number: 'ASC',
        spots: {
          spotNumber: 'ASC',
        },
      },
    });
  }
}
