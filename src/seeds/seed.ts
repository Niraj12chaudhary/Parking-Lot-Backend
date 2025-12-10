import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { FloorSeedService } from './floor-seed.service';
import { SpotSeedService } from './spot-seed.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  const floorSeeder = app.get(FloorSeedService);
  const spotSeeder = app.get(SpotSeedService);

  await floorSeeder.createFloors();
  await spotSeeder.createSpots();

  await app.close();
}

bootstrap().then(() => {
  console.log('Seeding completed.');
});
