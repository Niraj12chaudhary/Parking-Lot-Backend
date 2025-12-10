import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Spot } from 'src/common/entities/spot.entity';
import { Floor } from 'src/common/entities/floor.entity';
import { FloorSeedService } from './floor-seed.service';
import { SpotSeedService } from './spot-seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([Floor, Spot])],
  providers: [FloorSeedService, SpotSeedService],
  exports: [FloorSeedService, SpotSeedService],
})
export class SeedModule {}
